module.exports = function(minified) {
    var Clay = this;
    var _ = minified._;
    var $ = minified.$;
    var HTML = minified.HTML;

    Clay.on(Clay.EVENTS.AFTER_BUILD, function() {

        var widgets = Clay.getItemsByGroup('widget');
        widgets.forEach(function(widget) {
            widget.on('change', function() {
                widgets
                    .filter(function(w) { return w !== this; }, this)
                    .filter(function(w) { return w.get() !== '0'; })
                    .filter(function(w) { return w.get() === this.get(); }, this)
                    .forEach(function(w) { w.set('0'); });
            });
        });

    });
}
