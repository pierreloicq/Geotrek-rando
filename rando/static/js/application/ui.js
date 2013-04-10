function init_ui() {
    $(document).pjax('a.pjax', '#content');

    window.trekFilter = new TrekFilter();
    $(window.trekFilter).off('filterchange').on("filterchange", function(e, visible) {
        refresh_results(visible);
    });

    window.backPack = new BackPack();
    $('body').on("backpack-change", refresh_backpack);

    $(window).smartresize(function() {
         invalidate_maps();
    });
}

function page_load() {
    $('body').on('click', 'a.utils', function(e){
        e.preventDefault();
    });

    if ($("#mainmap-tag").length > 0) {
        view_home();
    }
    else {
        view_detail();
    }

    // Flex divs :)
    $('.row-fluid').each(function () {
        var $flex = $(this).find('.flex');
        if ($flex.length === 0) return;
        var span = Math.round(12 / $flex.length);
        $flex.each(function (i, v) {
            $(v).addClass('span'+span);
        });
    });

    init_share();

    // Refresh tab results
    window.trekFilter.load();
    refresh_backpack();

    // Add trek to backpack
    $('.add-sac').on('click', function (e) {
        var trekid = $(this).data('pk'),
            trekname = $(this).data('name');
        if (window.backPack.contains(trekid)) {
            window.backPack.remove(trekid);
            // Track event
            _gaq.push(['_trackEvent', 'Backpack', 'Remove', trekname]);
        }
        else {
            window.backPack.save(trekid);
            _gaq.push(['_trackEvent', 'Backpack', 'Add', trekname]);
        }
    });

    // Lang button
    $('#lang-switch a.utils').on('click', function(){
        $(this).siblings('ul').toggle();
    });
}

function view_home() {
    sliders();

    $('#toggle-filters').click(function() {
        $(this).toggleClass('active');
        $("#advanced-filters").toggle();
    });

    $('#clear-filters').off('click').on('click', function () {
        window.trekFilter.clear();
    });

    $("#mainmap").show();  // We are on home with map
    invalidate_maps();

    $('#result-backpack-tabs .nav-tabs a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
        $(this).parents('ul.nav-tabs').find('span.badge-warning').removeClass('badge-warning');
        $(this).find('span.badge').addClass('badge-warning');
    });

    // Show active tab
    if (window.location.hash) {
        $('#tab-' + window.location.hash.slice(1) + ' a').click();
    }

    $('#toggle-side-bar').off('click').on('click', function() {
        if (!$(this).hasClass('closed')) {
            var width_sidebar = $('.side-bar').width() - $(this).width();
            $('#side-bar').addClass('closed').animate({left : -width_sidebar+'px'}, 700, 'easeInOutExpo');
        }
        else {
            $('#side-bar').removeClass('closed').animate({left:'0'}, 700, 'easeInOutExpo');
        }
        $(this).toggleClass('closed');
    });

    // Zoom trek button
    $('.search-rando').off('click').on('click', function (e) {
        e.preventDefault();
        var trekOnMap = window.treksLayer.getLayer($(this).data('pk'));
        if (trekOnMap) {
            window.maps[0].fitFakeBounds(trekOnMap.getBounds());
            // Track event
            _gaq.push(['_trackEvent', 'Results', 'Zoom', trekOnMap.properties.name]);
        }
    });

    $('#side-bar .result').on('dblclick', function (e) {
        e.preventDefault();
        $('#trek-'+ $(this).data('id') +'.result a.pjax').click();
        // Track event
        _gaq.push(['_trackEvent', 'Results', 'Doubleclick', $(this).data('name')]);
    });

    // Highlight map on hover in sidebar results
    $('#side-bar .result').hover(function () {
        if (window.treksLayer) window.treksLayer.highlight($(this).data('id'), true);
      },
      function () {
        if (window.treksLayer) window.treksLayer.highlight($(this).data('id'), false);
      }
    );
    // Click on side-bar
    $('#side-bar .result').on('click', function (e) {
        e.preventDefault();

        // Do not fire click if clicked on search tools
        if ($(e.target).parents('.search-tools').length > 0)
            return;

        var trekOnMap = window.treksLayer.getLayer($(this).data('id'));
        if (trekOnMap) {
            // If multi - take first one
            if (trekOnMap instanceof L.MultiPolyline) {
                for (var i in trekOnMap._layers) {
                    trekOnMap = trekOnMap._layers[i];
                    break;
                }
            }
            var coords = trekOnMap.getLatLngs(),
                middlepoint = coords[Math.round(coords.length/2)];
            trekOnMap.fire('click', {
              latlng: middlepoint
            });
            // Track event
            _gaq.push(['_trackEvent', 'Results', 'Click', trekOnMap.properties && trekOnMap.properties.name]);
        }
        else {
          console.warn("Trek not on map: " + $(this).data('id'));
        }
    });
}

function refresh_results(matching) {
    for(var i=0; i<treks.features.length; i++) {
        var trek = treks.features[i],
            trekid = trek.properties.pk;
        if ($.inArray(trekid, matching) != -1) {
            $('#trek-'+trekid).show(200);
        }
        else {
            $('#trek-'+trekid).hide(200);
        }
    }
    if (matching.length > 0)
        $('#noresult').hide(200);
    else
        $('#noresult').show(200);
    // Refresh label with number of results
    $('#tab-results span.badge').html(matching.length);
}

function refresh_backpack() {
    for(var i=0; i<treks.features.length; i++) {
        var trek = treks.features[i],
            trekid = trek.properties.pk;
        if (window.backPack.contains(trekid)) {
            $('#backpack-trek-'+trekid).show(200);
            $('#trek-' + trekid + ' .btn.add-sac').addClass('active');
            $(".detail-content .btn[data-pk='"+ trekid + "']").addClass('active');
        }
        else {
            $('#backpack-trek-'+trekid).hide(200);
            $('#trek-' + trekid + ' .btn.add-sac').removeClass('active');
            $(".detail-content .btn[data-pk='"+ trekid + "']").removeClass('active');
        }
    }
    if (window.backPack.length() > 0)
        $('#backpackempty').hide(200);
    else
        $('#backpackempty').show(200);
    $('#tab-backpack span.badge').html(window.backPack.length());
}

function page_leave() {
    $("#global-share.active").click();

    // Deselect all treks on page leave
    if (treksLayer)
        treksLayer.eachLayer(function (l) {
            treksLayer.highlight(l.properties.pk, false);
        });
}

function view_detail() {
    $("#mainmap").hide();  // We are elsewhere

    $('#pois-accordion .accordion-toggle').click(function (e) {
        if ($(this).hasClass('open')) {
          $(this).removeClass('open');
          $('#pois-accordion').trigger('close', [this]);
        }
        else {
          $(this).addClass('open');
          $('#pois-accordion').trigger('open', [this]);
        }
    });

    //Load altimetric graph
    altimetricInit();
}

function altimetricInit() {
    /* 
     * Load altimetric profile from JSON
     */
    $.getJSON(altimetric_url, function(data) {
        $('#profilealtitude').sparkline(data.profile, {
            tooltipSuffix: ' m',
            numberDigitGroupSep: '',
            width: '100%',
            height: 100
        });
        $('#profilealtitude').bind('sparklineRegionChange', function(ev) {
            var sparkline = ev.sparklines[0],
                region = sparkline.getCurrentRegionFields();
                value = region.y;
            $('#mouseoverprofil').text(Math.round(region.x) +" m");
        }).bind('mouseleave', function() {
            $('#mouseoverprofil').text('');
        });
    });
}

function sliders() {
    var saveSlider = function (event, ui) {
        window.trekFilter.sliderChanged(ui.values[0],
                                        ui.values[1],
                                        $(this).data("filter"),
                                        $(this));
    };

    $( "#stage" ).slider({
        range: true,
        step: 1,
        min: 1,
        max: 3,
        values: [ 1, 3 ],
        slide: saveSlider
    });

    $( "#time" ).slider({
        range: true,
        step: 1,
        min: 0,
        max: 4,
        values: [ 0, 4 ],
        slide: saveSlider
    });

    $( "#den" ).slider({
        range: true,
        step: 1,
        min: 0,
        max: 3,
        values: [ 0, 3 ],
        slide: saveSlider
    });
}

function init_share() {
    var $share = $('#global-share'),
        $panel = $('#social-panel'),
        markup = $panel.html(),
        shown = false;
      // , init = false;
    // $panel.remove();

    var previous = $share.data('popover');
    if (previous) {
        $share.removeData('popover');
    }
    $share.popover({
        animation: false,
        html: true,
        placement: 'left',
        trigger: 'manual',
        title: '',
        content: markup
    });

    $share.off('click').on('click', function () {
        var $this = $(this);
        $this.toggleClass('active');
        var popover = $this.data('popover');

        // if(init){
        //     popover.toggle();
        //     return;
        // }

        // init = true;

        if (shown) {
            popover.hide();
            shown = false;
            return;
        }

        shown = true;
        popover.show();
        // Prevent to go outside screen
        if (popover.tip().position().top < 0) {
            popover.tip().css('top', '0px');
        }
        var lang = $("meta[name='language']").attr('content');
        lang = lang + '_' + lang.toUpperCase();
        Socialite.setup({
            facebook: {lang: lang},
            twitter: {lang: lang},
            googleplus: {lang: lang}
        });
        Socialite.load(popover.tip());
    });
}