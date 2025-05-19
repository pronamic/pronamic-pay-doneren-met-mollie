<?php

$options = getopt(
	'',
	[
		'dir::',
	]
);

$dir = __DIR__;

if ( array_key_exists( 'dir', $options ) ) {
	$dir = $options['dir'];
}

$baseDir = $dir;

$excludedDirs = [ 'vendor', 'node_modules', 'build' ]; // Pas aan naar wens

$directoryIterator = new RecursiveDirectoryIterator(
	$baseDir,
	RecursiveDirectoryIterator::SKIP_DOTS
);

$filterIterator = new RecursiveCallbackFilterIterator(
	$directoryIterator,
	function ( $current, $key, $iterator ) use ( $excludedDirs ) {
		if ( $current->isDir() ) {
			$dirname = $current->getFilename();
			return ! in_array( $dirname, $excludedDirs, true ); // Sluit map uit
		}

		return $current->isFile() && $current->getFilename() === 'block.json';
	}
);

$iterator = new RecursiveIteratorIterator( $filterIterator );

$allowedDomains = [
	'action-scheduler',
	'pronamic_ideal',
	'pronamic-datetime',
	'pronamic-forms',
	'pronamic-money',
	'pronamic-pay-mollie',
];

$newTextDomain = 'pronamic-pay-doneren-met-mollie';

foreach ( $iterator as $file ) {
	echo 'Gevonden: ' . $file->getPathname() . PHP_EOL;

	$contents = file_get_contents( $file );

	$pattern = '/(?<prefix>"textdomain"\s*:\s*")(?<domain>[a-zA-Z0-9_-]+)(?<suffix>")/';

	$replaced = preg_replace_callback(
		$pattern,
		function ( $matches ) use ( $allowedDomains, $newTextDomain ) {
			if ( in_array( $matches['domain'], $allowedDomains, true ) ) {
				return $matches['prefix'] . $newTextDomain . $matches['suffix'];
			}

			return $matches[0]; // geen wijziging
		},
		$contents
	);

	if ( $replaced !== $contents ) {
		file_put_contents( $file, $replaced );
		echo "Textdomain vervangen in $file\n";
	} else {
		echo "Geen vervanging nodig voor $file\n";
	}
}

$patterns = [
	// __() function pattern
	'/
    (?<prefix>__\s*\(\s*[^,]+,\s*)
    (?<quote>["\'])
    (?<domain>[a-zA-Z0-9_-]+)
    \k<quote>
    (?<suffix>\s*\))
    /x',

	// _n() function pattern
	'/
    (?<prefix>_n\s*\(\s*[^,]+,\s*[^,]+,\s*[^,]+,\s*)  # Match the function name _n with three preceding arguments,
                                                      # capturing up to and including the comma after the third argument.

    (?<quote>["\'])                                   # Capture the opening quote (single or double) of the text domain string.

    (?<domain>[a-zA-Z0-9_-]+)                         # Capture the text domain.

    \k<quote>                                        # Match the exact same closing quote.

    (?<suffix>\s*\))                                 # Capture trailing whitespace and the closing parenthesis.
    /x',

	// _x() function pattern
	'/
    (?<prefix>_x\s*\(\s*[^,]+,\s*[^,]+,\s*)          # Match the function name _x with two preceding arguments,
                                                      # capturing up to and including the comma after the second argument.

    (?<quote>["\'])                                   # Capture the opening quote.

    (?<domain>[a-zA-Z0-9_-]+)                         # Capture the text domain.

    \k<quote>                                        # Match the exact same closing quote.

    (?<suffix>\s*\))                                 # Capture trailing whitespace and the closing parenthesis.
    /x',
];

$filterIterator = new RecursiveCallbackFilterIterator(
	$directoryIterator,
	function ( $current, $key, $iterator ) use ( $excludedDirs ) {
		if ( $current->isDir() ) {
			$dirname = $current->getFilename();
			return ! in_array( $dirname, $excludedDirs, true ); // Sluit map uit
		}

		return $current->isFile() && \in_array( $current->getExtension(), [ 'js', 'php' ], true );
	}
);

$iterator = new RecursiveIteratorIterator( $filterIterator );

foreach ( $iterator as $file ) {
	echo 'Gevonden: ' . $file->getPathname() . PHP_EOL;

	$orignial = file_get_contents( $file );
	
	$contents = $orignial;

	foreach ( $patterns as $pattern ) {
		$contents = preg_replace_callback(
			$pattern,
			function ( $matches ) use ( $allowedDomains, $newTextDomain ) {
				if ( in_array( $matches['domain'], $allowedDomains, true ) ) {
					return $matches['prefix'] . $matches['quote'] . $newTextDomain . $matches['quote'] . $matches['suffix'];
				}
				// Geen wijziging als niet in whitelist
				return $matches[0];
			},
			$contents
		);
	}

	if ( $orignial !== $contents ) {
		file_put_contents( $file, $contents );
		echo "Textdomain vervangen in $file\n";
	} else {
		echo "Geen vervanging nodig voor $file\n";
	}
}
