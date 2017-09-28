define(function (require, exports, module) {
    "use strict";

    var LiveDevMultiBrowser = brackets.getModule("LiveDevelopment/LiveDevMultiBrowser");
    var Path                = brackets.getModule("filesystem/impls/filer/BracketsFiler").Path;
    var CommandManager      = brackets.getModule("command/CommandManager");
    var Commands            = brackets.getModule("command/Commands");
    var FileSystem          = brackets.getModule("filesystem/FileSystem");

    var LinkManagerRemote = require("text!lib/LinkManagerRemote.js");

    function getRemoteScript() {
        // Intercept clicks on <a> in the preview document
        return "<script>\n" + LinkManagerRemote + "</script>\n";
    }

    function getNavigationPath(message) {
        var match = message.match(/^bramble-navigate\:(.+)/);
        var navPath = match && match[1];
        // TODO (Brad 2017-09-28): Replace with a complete fix.
        // Partial support for links with anchors or queryparams - strip the
        // anchor and queryparam portions of the URL entirely, allowing at
        // least the navigation to succeed (where before we hit an error and
        // took no action at all).
        // The long-term solution is probably a change in LinkManagerRemote.js
        // that handles anchors after successful navigation.
        if (navPath) {
            navPath = navPath.replace(/[#?].*$/, '');
        }
        return navPath;
    }

    // Whether or not this message is a navigation request from the LinkManagerRemote script.
    function isNavigationRequest(message) {
        return !!getNavigationPath(message);
    }

    // Attempt to navigate the preview and editor to a new path
    function navigate(message) {
        var path = getNavigationPath(message);
        if(!path) {
            return;
        }
        
        path = decodeURI(path);

        var currentDoc = LiveDevMultiBrowser._getCurrentLiveDoc();
        if(!currentDoc) {
            return;
        }

        var currentDir = Path.dirname(currentDoc.doc.file.fullPath);
        path = Path.resolve(currentDir, path);

        // Open it in the editor, which will also attempt to update the preview to match
        FileSystem.resolve(path, function(err, file) {
            if(err) {
                console.log("[Bramble Error] unable to open path in editor", path, err);
                return;
            }
            CommandManager.execute(Commands.CMD_ADD_TO_WORKINGSET_AND_OPEN, { fullPath: file.fullPath });
        });
    }

    exports.getRemoteScript = getRemoteScript;
    exports.isNavigationRequest = isNavigationRequest;
    exports.navigate = navigate;
});
