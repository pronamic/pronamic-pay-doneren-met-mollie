/**
 * Record a scene like a person would: with a visible cursor, typing and
 * pauses that follow the narration.
 *
 * Playwright videos don't show the mouse, so a fake cursor is drawn on top of
 * the page. Every narration step records when it starts in the video, so
 * `compose.js` can place the audio at exactly that moment.
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { dirs, readDurations } = require( './lib' );

// Pause after each narration step, in seconds.
const stepPause = 0.4;

/**
 * Fake cursor, added to every page in the top frame.
 *
 * The position is kept in the session storage, so the cursor stays put when
 * a link loads a new page.
 */
function cursorInitScript() {
	if ( window.top !== window ) {
		return;
	}

	const key = 'video-cursor';

	const install = () => {
		const saved = JSON.parse( sessionStorage.getItem( key ) || 'null' );

		const position = saved ?? {
			x: window.innerWidth / 2,
			y: window.innerHeight / 2,
		};

		const cursor = document.createElement( 'div' );

		cursor.innerHTML =
			'<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M6 3l15 14h-8.2l-4.6 7.6z" fill="#000" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';

		Object.assign( cursor.style, {
			position: 'fixed',
			left: '0',
			top: '0',
			width: '28px',
			height: '28px',
			margin: '-3px 0 0 -6px',
			zIndex: '2147483647',
			pointerEvents: 'none',
			filter: 'drop-shadow( 0 1px 2px rgba( 0, 0, 0, 0.35 ) )',
			transform: `translate( ${ position.x }px, ${ position.y }px )`,
		} );

		document.documentElement.appendChild( cursor );

		window.videoCursor = {
			move( x, y, duration ) {
				cursor.animate(
					[
						{
							transform: `translate( ${ position.x }px, ${ position.y }px )`,
						},
						{ transform: `translate( ${ x }px, ${ y }px )` },
					],
					{
						duration,
						easing: 'cubic-bezier( 0.45, 0, 0.25, 1 )',
						fill: 'forwards',
					}
				);

				position.x = x;
				position.y = y;

				sessionStorage.setItem( key, JSON.stringify( position ) );
			},
			click() {
				const ripple = document.createElement( 'div' );

				Object.assign( ripple.style, {
					position: 'fixed',
					left: `${ position.x - 18 }px`,
					top: `${ position.y - 18 }px`,
					width: '36px',
					height: '36px',
					borderRadius: '50%',
					background: 'rgba( 50, 25, 101, 0.35 )',
					zIndex: '2147483646',
					pointerEvents: 'none',
				} );

				document.documentElement.appendChild( ripple );

				ripple
					.animate(
						[
							{ transform: 'scale( 0.3 )', opacity: 1 },
							{ transform: 'scale( 1.4 )', opacity: 0 },
						],
						{ duration: 500, easing: 'ease-out' }
					)
					.finished.then( () => ripple.remove() );
			},
			keys( label ) {
				const keycap = document.createElement( 'div' );

				keycap.textContent = label;

				Object.assign( keycap.style, {
					position: 'fixed',
					left: `${ position.x + 24 }px`,
					top: `${ position.y + 20 }px`,
					padding: '6px 12px',
					borderRadius: '8px',
					background: 'rgba( 30, 30, 30, 0.85 )',
					color: '#fff',
					font: '600 18px -apple-system, BlinkMacSystemFont, sans-serif',
					zIndex: '2147483647',
					pointerEvents: 'none',
				} );

				document.documentElement.appendChild( keycap );

				keycap
					.animate(
						[
							{ opacity: 0, transform: 'translateY( 6px )' },
							{ opacity: 1, transform: 'none', offset: 0.15 },
							{ opacity: 1, transform: 'none', offset: 0.8 },
							{ opacity: 0, transform: 'none' },
						],
						{ duration: 1400, easing: 'ease-out' }
					)
					.finished.then( () => keycap.remove() );
			},
			highlight( rect, duration ) {
				const box = document.createElement( 'div' );

				Object.assign( box.style, {
					position: 'fixed',
					left: `${ rect.x - 8 }px`,
					top: `${ rect.y - 8 }px`,
					width: `${ rect.width + 16 }px`,
					height: `${ rect.height + 16 }px`,
					border: '3px solid #f9461c',
					borderRadius: '10px',
					boxShadow: '0 0 0 6px rgba( 249, 70, 28, 0.2 )',
					zIndex: '2147483646',
					pointerEvents: 'none',
				} );

				document.documentElement.appendChild( box );

				box.animate(
					[
						{ opacity: 0, transform: 'scale( 1.04 )' },
						{ opacity: 1, transform: 'scale( 1 )', offset: 0.1 },
						{ opacity: 1, transform: 'scale( 1 )', offset: 0.85 },
						{ opacity: 0, transform: 'scale( 1 )' },
					],
					{ duration, easing: 'ease-out' }
				).finished.then( () => box.remove() );
			},
			get position() {
				return { ...position };
			},
		};
	};

	if ( document.documentElement ) {
		install();
	} else {
		document.addEventListener( 'DOMContentLoaded', install );
	}
}

/**
 * Scene director.
 */
class Director {
	/**
	 * Constructor.
	 *
	 * @param {import('@playwright/test').Page} page    Page.
	 * @param {string}                          sceneId Scene ID from `script.json`.
	 */
	constructor( page, sceneId ) {
		this.page = page;
		this.sceneId = sceneId;
		this.durations = readDurations();
		this.steps = [];

		// The video starts when the page is created, just before the test.
		this.videoStart = Date.now();
	}

	/**
	 * Add the fake cursor, call before the first navigation.
	 *
	 * @param {import('@playwright/test').Page} page Page.
	 * @return {Promise<void>}
	 */
	static async prepare( page ) {
		await page.addInitScript( cursorInitScript );
	}

	/**
	 * Seconds since the start of the video.
	 *
	 * @return {number} Seconds.
	 */
	now() {
		return ( Date.now() - this.videoStart ) / 1000;
	}

	/**
	 * Run a narration step.
	 *
	 * The actions start together with the narration, and the step lasts at
	 * least as long as the narration.
	 *
	 * @param {string}              id     Step ID from `script.json`.
	 * @param {() => Promise<void>} action Actions.
	 * @return {Promise<void>}
	 */
	async step( id, action = async () => {} ) {
		if ( ! ( id in this.durations ) ) {
			throw new Error( `No narration for step ${ id }.` );
		}

		const at = this.now();

		this.steps.push( { id, at } );

		await action();

		const remaining = at + this.durations[ id ] + stepPause - this.now();

		if ( remaining > 0 ) {
			await this.page.waitForTimeout( remaining * 1000 );
		}
	}

	/**
	 * Move the cursor to a point, smoothly.
	 *
	 * @param {number} x X.
	 * @param {number} y Y.
	 * @return {Promise<void>}
	 */
	async moveTo( x, y ) {
		const from = await this.page.evaluate(
			() => window.videoCursor?.position
		);

		const distance = from ? Math.hypot( x - from.x, y - from.y ) : 500;

		const duration = Math.round(
			Math.min( 1100, Math.max( 350, 250 + distance * 0.6 ) )
		);

		await this.page.evaluate(
			( [ toX, toY, ms ] ) => window.videoCursor?.move( toX, toY, ms ),
			[ x, y, duration ]
		);

		// The real mouse follows, for hover effects.
		await this.page.mouse.move( x, y, { steps: 8 } );

		await this.page.waitForTimeout( duration );
	}

	/**
	 * Scroll an element into view, smoothly.
	 *
	 * @param {import('@playwright/test').Locator} locator Element.
	 * @return {Promise<void>}
	 */
	async scrollTo( locator ) {
		const scrolled = await locator.evaluate( ( element ) => {
			const rect = element.getBoundingClientRect();

			if ( rect.top >= 80 && rect.bottom <= window.innerHeight - 80 ) {
				return false;
			}

			element.scrollIntoView( { behavior: 'smooth', block: 'center' } );

			return true;
		} );

		if ( scrolled ) {
			await this.page.waitForTimeout( 900 );
		}
	}

	/**
	 * Move the cursor to an element.
	 *
	 * @param {import('@playwright/test').Locator} locator Element.
	 * @return {Promise<{x: number, y: number}>} The point.
	 */
	async hover( locator ) {
		await locator.waitFor();
		await this.scrollTo( locator );

		const box = await locator.boundingBox();

		const point = {
			x: Math.round( box.x + box.width / 2 ),
			y: Math.round( box.y + box.height / 2 ),
		};

		await this.moveTo( point.x, point.y );

		return point;
	}

	/**
	 * Draw attention to an element with an outline that fades out.
	 *
	 * @param {import('@playwright/test').Locator} locator  Element.
	 * @param {number}                             duration Milliseconds.
	 * @return {Promise<void>}
	 */
	async highlight( locator, duration = 2500 ) {
		await locator.waitFor();
		await this.scrollTo( locator );

		const box = await locator.boundingBox();

		await this.page.evaluate(
			( [ rect, ms ] ) => window.videoCursor?.highlight( rect, ms ),
			[ box, duration ]
		);
	}

	/**
	 * Click an element.
	 *
	 * @param {import('@playwright/test').Locator} locator Element.
	 * @return {Promise<void>}
	 */
	async click( locator ) {
		const point = await this.hover( locator );

		await this.page.evaluate( () => window.videoCursor?.click() );
		await this.page.mouse.click( point.x, point.y );
		await this.page.waitForTimeout( 300 );
	}

	/**
	 * Click a field and type, key by key.
	 *
	 * @param {import('@playwright/test').Locator} locator Field.
	 * @param {string}                             text    Text.
	 * @return {Promise<void>}
	 */
	async type( locator, text ) {
		await this.click( locator );
		await this.page.keyboard.type( text, { delay: 70 } );
	}

	/**
	 * Click a field and paste, the text appears at once.
	 *
	 * For secrets like API keys, which people copy and don't type.
	 *
	 * @param {import('@playwright/test').Locator} locator Field.
	 * @param {string}                             text    Text.
	 * @return {Promise<void>}
	 */
	async paste( locator, text ) {
		await this.click( locator );
		await this.page.waitForTimeout( 300 );
		await this.page.evaluate( () => window.videoCursor?.keys( '⌘ V' ) );
		await this.page.waitForTimeout( 250 );
		await this.page.keyboard.insertText( text );
		await this.page.waitForTimeout( 600 );
	}

	/**
	 * Choose an option in a select.
	 *
	 * The native dropdown isn't in the video, so it just changes.
	 *
	 * @param {import('@playwright/test').Locator} locator Select.
	 * @param {string}                             value   Option value.
	 * @return {Promise<void>}
	 */
	async select( locator, value ) {
		await this.hover( locator );
		await this.page.evaluate( () => window.videoCursor?.click() );
		await locator.selectOption( value );
		await this.page.waitForTimeout( 300 );
	}

	/**
	 * Close the page and save the video and the timeline.
	 *
	 * @return {Promise<void>}
	 */
	async finish() {
		const end = this.now();

		const video = this.page.video();

		await this.page.close();

		fs.mkdirSync( dirs.scenes, { recursive: true } );

		await video.saveAs(
			path.join( dirs.scenes, `${ this.sceneId }.webm` )
		);

		this.writeTimeline( { steps: this.steps, end } );
	}

	/**
	 * Mark the scene as skipped, e.g. without a Mollie test API key.
	 *
	 * @param {string} reason Reason.
	 * @return {void}
	 */
	skip( reason ) {
		this.writeTimeline( { skipped: reason } );
	}

	/**
	 * Write the timeline for `compose.js`.
	 *
	 * @param {Object} timeline Timeline.
	 * @return {void}
	 */
	writeTimeline( timeline ) {
		fs.mkdirSync( dirs.scenes, { recursive: true } );

		fs.writeFileSync(
			path.join( dirs.scenes, `${ this.sceneId }.json` ),
			JSON.stringify( timeline, null, '\t' ) + '\n'
		);
	}
}

module.exports = { Director };
