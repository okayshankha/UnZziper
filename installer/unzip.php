<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$zip = new ZipArchive;
if (!isset($_POST['Xpo'])) {
    die("param");
}
#echo $data;
$data = json_decode(str_replace("'", "", trim($_POST['Xpo'])), TRUE);
if (!file_exists('./uploads/' . $data['fileName'])) {
    die('404 not found');
}else{
	#echo "YES";
}

$res = $zip->open('./uploads/' . $data['fileName']);
if ($res === TRUE) {
    if($zip->extractTo('./testUnzip/')){
      	if (isset($data['deleteXpo'])) {
      		if ($data['deleteXpo'] == 'true')
    			unlink('./uploads/' . $data['fileName']);
		}
    }
    $zip->close();
    $r['unzip'] = "success";
    
} else {
    $r['unzip'] = "failed";
}

echo json_encode($r);
