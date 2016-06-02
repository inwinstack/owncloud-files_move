/**
 * ownCloud - files_move
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author simon <simon.l@inwinstack.com>
 * @copyright simon 2016
 */

if(!OCA.Files_move){
	/**
	 * Namespace for the files_move app
	 * @namespace OCA.Files_move
	 */
	OCA.Files_move = {};
}
/**
 * @namespace OCA.Files_move.move
 */
OCA.Files_move.Move = {
	/**
	 * @var string appName used for translation file
	 * as transifex uses the github project name, use this instead of the appName
	 */
	appName: 'oc_files_move',
	registerFileAction: function(){
		var img = OC.imagePath('core','actions/play');
		OCA.Files.fileActions.register(
			'all',
			t(this.appName,'Move'),
			OC.PERMISSION_UPDATE,
			OC.imagePath('core','actions/play'),
			function(file) {
			    OCA.Files_move.Move.createUI(true,file);
			}
		);
        // append move button to Actions
		var el = $('#app-content-files #headerName .selectedActions');
		$('<a class="move" id="move" href=""><img class="svg" src="'+img+'" alt="'+t(this.appName,'Move')+'">'+t(this.appName,'Move')+'</a>').appendTo(el);
		el.find('.move').click(this.selectFiles)
    },

	initialize: function(){
		this.registerFileAction();
    },	
    	
	selectFiles: function(event){
		// move multiple files
		event.stopPropagation();
		event.preventDefault();
        var files = FileList.getSelectedFiles();
		var file='';
		for( var i=0;i<files.length;++i) {
			file += (files[i].name)+';';
		}
		OCA.Files_move.Move.createUI(false,file);
		return false;
	},

	/**
	 * draw the move-dialog;
	 *
	 * @local - true for single file, false for global use
	 * @file - filename in the local directory
	 */
	createUI: function (local,file){
        OC.dialogs.filepicker(
            t(OCA.Files_move.Move.appName, "Select a Dest"),
            function (path) {
                var dir  = $('#dir').val();
                $.post(
                    OC.generateUrl('/apps/files_move/move'),
                    {
                        srcDir: dir, 
                        srcFile: file, 
                        dest: path
                    },
                    function(data) {
                        if(data.status == "error") {
                            OC.Notification.showTemporary(t(OCA.Files_move.Move.appName,data.message));
                            if(data.hasOwnProperty('name') && data.name.length != 0) {
                                $.each(data.name,function(index,value) {
                                    FileList.remove(value);
                                });
                            }
                        }
                        
                        if(data.status == "success") {
                            //remove each moved file
                            OC.Notification.showTemporary(t(OCA.Files_move.Move.appName,"move successfully"));
                            $.each(data.name,function(index,value) {
                                FileList.remove(value);
                            });
                        }
                    });
            },
            false,
            ['httpd/unix-directory']
        );
    },
}
$(document).ready(function() {
   
    /**
	 * check whether we are in files-app and we are not in a public-shared folder
	 */
	if(!OCA.Files){ // we don't have the files app, so ignore anything
		return;
	}
	if(/(public)\.php/i.exec(window.location.href)!=null){
		return; // escape when the requested file is public.php
	}

	/**
	 * Init Files_move
	 */
	OCA.Files_move.Move.initialize();
    
    ajaxSuccess.bind('GET:/apps/files/ajax/list', function(event) {
        var permission = FileList.getDirectoryPermissions();
        
        if(!(permission & OC.PERMISSION_UPDATE)) {
            $('#move').hide();
        } else {
            $('#move').show();
        }
    });
});
