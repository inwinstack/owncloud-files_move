<?php 
/**
 * ownCloud - files_move
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author simon <simon.l@inwinstack.com>
 * @copyright simon 2016
 */

namespace OCA\Files_Move\Controller;

use \OCP\IRequest;
use \OCP\AppFramework\Http\TemplateResponse;
use \OCP\AppFramework\Http\DataResponse;
use \OCP\AppFramework\Controller;
use \OCP\IServerContainer;
use \OCP\IL10N;

class MoveController extends Controller {
	private $l;
	private $storage;

	public function __construct($AppName, IRequest $request, IL10N $l, $UserFolder) {
		parent::__construct($AppName, $request);
		$this->storage = $UserFolder;
		$this->l = $l;
	}
	/**
	 * move/copy $file from $srcDir to $dest
	 * @param string $srcDir
	 * @param string $file - semicolon separated filenames
	 * @param string $dest - destination Directory
	 * @NoAdminRequired
	 */
	public function index($srcDir, $srcFile, $dest) {
		if(empty($srcFile) || empty($dest)) {
			
            return new DataResponse(array("status"=>"error","message"=>$this->l->t('No data supplied.')));
		}

		// prepare file names
		$files = explode(';', $srcFile);
		if(!is_array($files)) $files = array($files);
		$files = array_filter($files); // remove empty elements

		$srcDir = \OC\Files\Filesystem::normalizePath($srcDir).'/';
		$dest   = \OC\Files\Filesystem::normalizePath($dest).'/';
		
        $err = array();
		$filesMoved = array();
		$msg =array();
		foreach($files as $file) {
            preg_match("/.*\/(.*)\//",$dest, $matches);
            if($matches[1] == $file) {
                
                $msg[] = $this->l->t('Failed to move,Src and target folder are the same.');
                continue;
            }
			$toPath = ($dest.$file);
			$fromPath = ($srcDir.$file);
			$from = $this->storage->get($fromPath);
			$to = $this->storage->getFullPath($toPath);
			
            if($this->storage->nodeExists($toPath)) {
				$err['exists'][] = $file;
			}
			else {
				try {
					$from->move($to);
					$filesMoved[] = $file;
				}
				catch(\OCP\Files\NotPermittedException $e) {
					$err['failed'][] = $file;
				}
				catch(\Exception $e) { 
					preg_match("/(.*)( is locked)/",$e->getMessage(), $matches);
                    $msg[] = $file.": ".$matches[1];
				}
			}
		}
		
        if(!empty($err['failed'])) {
		   	$msg[] = $this->l->t("You do not have edit permission of target folder.");
            
            return new DataResponse(array('status'=>'error','action'=>'move' ,'name'=>$filesMoved,'message'=>$msg));
        }

        if(!empty($err['exists'])) {
            if(!empty($filesMoved)) {
		   	    $msg[] = $this->l->t("Some of selected files already exist in the target folder.");
            }
            else {
                $msg[] = $this->l->t("All of selected files already exist in the target folder.");
            }
		}
		
        $status = (empty($msg)?'success':'error');
		$result = array('status'=>$status,'action'=>'move','name'=>$filesMoved,'message'=>$msg);
		
        return new DataResponse($result);
	}
}

