<?php
	if (($handle = fopen('fdi2014.csv', 'r')) === false) {
	    die('Error opening file');
	}

	$headers = fgetcsv($handle, 1024, ',');
	$complete = array();

	while ($row = fgetcsv($handle, 1024, ',')) {
	    $complete[$row[2]] = array_combine($headers, $row);
	}

	fclose($handle);

	echo json_encode($complete);
?>