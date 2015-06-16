'use strict';

function Rando3DController(result, $scope, $timeout, $modalInstance, globalSettings, translationService, settingsFactory) {
    $scope.result = result;
    function init3D() {
        var pk = result.id;
        var customSettings = {
            IMAGES_FOLDER: 'images/3d/',
            DEM_URL: settingsFactory.trekUrl.replace(/\$lang/, translationService.getCurrentLang().code) + pk + '/' + globalSettings.DEM_FILE,
            PROFILE_URL: settingsFactory.trekUrl.replace(/\$lang/, translationService.getCurrentLang().code) + pk + '/' + globalSettings.PROFILE_FILE,
            POI_URL: settingsFactory.trekUrl.replace(/\$lang/, translationService.getCurrentLang().code) + pk + '/' + globalSettings.POI_FILE,
            TILE_TEX_URL: "https://a.tiles.mapbox.com/v3/makina-corpus.i3p1001l/{z}/{x}/{y}.png",
            SIDE_TEX_URL: "/images/3d/side.jpg",
            CAM_SPEED_F: 100,
            PICTO_PREFIX: globalSettings.API_URL,
            TREK_COLOR: {
                R: 0.6,
                V: 0.1,
                B: 0.1
            }
        };

        var canvas = document.getElementById('canvas_renderer');
        var cameraID = "examine";
        var app3D = new Rando3D();
        var scene = app3D.init(customSettings, canvas, cameraID);
        scene.init();    
    }

    $timeout(init3D, 500);

    $scope.close = function () {
        $modalInstance.dismiss('close');
    };
    
}

module.exports = {
    Rando3DController: Rando3DController
};