module.exports = function(minified) {
    var Clay = this;
    var _ = minified._;
    var $ = minified.$;
    var HTML = minified.HTML;

     var providers = {
        "0": "owm",
        "1": "wu",
        "2": "forecast"
    };

    Clay.on(Clay.EVENTS.BEFORE_BUILD, function() {
        var platform = Clay.meta.activeWatchInfo.platform || 'diorite';
        var widgets = Clay.config[2].items[1].options;
        if (platform != 'diorite') {
            Clay.config[2].items[1].options[3].value.splice(2, 1);
        }
        if (platform == 'aplite') {
            Clay.config[2].items[1].options.splice(3, 1);
        }
        var len = platform == 'chalk' ? 3 : 4;
        for (var i = 2; i < len; i++) {
            Clay.config[2].items[i].options = widgets;
        }
        if (platform == 'chalk') {
            Clay.config[2].items[1].label = 'Left';
            Clay.config[2].items[2].label = 'Right';
        }
    });

    function configureWeather() {
        var weatherProvider = Clay.getItemByMessageKey('WEATHER_PROVIDER');
        var weatherKey = Clay.getItemByMessageKey('WEATHER_KEY');
        var masterKeyEmail = Clay.getItemById('masterKeyEmail');
        var masterKeyPin = Clay.getItemById('masterKeyPin');
        var masterKeyButton = Clay.getItemById('masterKeyButton');
        var masterKeyText = Clay.getItemById('masterKeyText');

        masterKeyText.hide();

        var masterKey;

        masterKeyButton.on('click', function() {
            var email = masterKeyEmail.get();
            var pin = masterKeyPin.get();
            if ((!masterKey || !masterKey.success) && email && pin) {
                var url = _.format('https://pmkey.xyz/search/?email={{email}}&pin={{pin}}', { email : email, pin : pin });
                $.request('get', url).then(function(txt, xhr) {
                    masterKey = JSON.parse(txt);
                    if (masterKey.success && masterKey.keys.weather) {
                        var weather = masterKey.keys.weather;
                        var provider = providers[weatherProvider.get()];
                        if (provider) weatherKey.set(weather[provider]);
                        masterKeyText.set('Success');
                        masterKeyText.show();
                    } else {
                        masterKeyEmail.disable();
                        masterKeyPin.disable();
                        masterKeyButton.disable();
                        masterKeyText.set(masterKey.error);
                        masterKeyText.show();
                    }
                }).error(function(status, txt, xhr) {
                    masterKeyEmail.disable();
                    masterKeyPin.disable();
                    masterKeyButton.disable();
                    masterKeyText.set(status + ': ' + txt);
                    masterKeyText.show();
                });
            } else if (masterKey && masterKey.success && masterKey.keys.weather) {
                var weather = masterKey.keys.weather;
                var provider = providers[weatherProvider.get()];
                if (provider) weatherKey.set(weather[provider]);
            }
        });

        weatherProvider.on('change', function() {
            if (masterKey) {
                var weather = masterKey.keys.weather;
                var provider = providers[weatherProvider.get()];
                if (provider) weatherKey.set(weather[provider]);
            }
        });
    }

    Clay.on(Clay.EVENTS.AFTER_BUILD, function() {
        var platform = Clay.meta.activeWatchInfo.platform || 'diorite';

        var widgets = Clay.getItemsByGroup('widget');
        widgets.forEach(function(widget) {
            widget.on('change', function() {
                widgets
                    .filter(function(w) { return w !== this; }, this)
                    .filter(function(w) { return w.get() !== '0'; })
                    .filter(function(w) { return w.get() === this.get(); }, this)
                    .forEach(function(w) { w.set('0'); });

                if (widgets.map(function(w) { return w.get(); }).indexOf('6') > -1) {
                    Clay.getItemsByGroup('alt-time').forEach(function(i) { i.show(); });
                } else {
                    Clay.getItemsByGroup('alt-time').forEach(function(i) { i.hide(); });
                }

                if (widgets.map(function(w) { return w.get(); }).indexOf('5') > -1) {
                    Clay.getItemsByGroup('weather').forEach(function(i) { i.show(); });
                } else {
                    Clay.getItemsByGroup('weather').forEach(function(i) { i.hide(); });
                }

                if (widgets.map(function(w) { return w.get(); }).indexOf('3') > -1) {
                    Clay.getItemsByGroup('battery').forEach(function(i) { i.hide(); });
                } else {
                    Clay.getItemsByGroup('battery').forEach(function(i) { i.show(); });
                }
            }).trigger('change');
        });

        Clay.getItemByMessageKey('ALT_TIME').on('change', function() {
            var val = this.get();
            this.$element.select('.description').ht('UTC' + (val >= 0 ? '+' : '') + val);
        }).trigger('change');

        if (platform != 'aplite') {
            var gpsToggle = Clay.getItemByMessageKey('WEATHER_USE_GPS');
            var locationInput = Clay.getItemByMessageKey('WEATHER_LOCATION_NAME');
            gpsToggle.on('change', function() {
                if (gpsToggle.get()) locationInput.hide();
                else locationInput.show();
            }).trigger('change');
        }

        configureWeather();
    });
}
