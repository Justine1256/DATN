<?php
ini_set('upload_tmp_dir', 'C:\\htdocs\\DATN\\back-end\\tmp');

$tmp = ini_get('upload_tmp_dir');
echo "upload_tmp_dir: $tmp\n";
echo "is_writable: " . (is_writable($tmp) ? 'yes' : 'no') . "\n";
