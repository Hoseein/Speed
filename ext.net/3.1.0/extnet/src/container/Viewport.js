Ext.define('Ext.net.plugin.Viewport', {
    extend: 'Ext.plugin.Viewport',
    alias: 'plugin.netviewport',

    statics: {
        setupViewport: function () {
            var me = this,
                body = Ext.getBody();

            el = me.el = Ext.get(me.renderTo || Ext.net.ResourceMgr.getAspForm() || body);

            // Get the DOM disruption over with before the Viewport renders and begins a layout
            Ext.getScrollbarSize();

            // Clear any dimensions, we will size later on
            me.width = me.height = undefined;

            Ext.fly(document.documentElement).addCls(me.viewportCls);
            el.setHeight = el.setWidth = Ext.emptyFn;
            body.setHeight = body.setWidth = Ext.emptyFn;
            el.dom.scroll = 'no';
            body.dom.scroll = 'no';
            me.allowDomMove = false;
            me.renderTo = me.el;

            if (me.rtl) {
                body.addCls(Ext.baseCSSPrefix + "rtl");
            }

            body.applyStyles({
                overflow: "hidden",
                margin: "0",
                padding: "0",
                border: "0px none",
                height: "100%"
            });

            if (Ext.supports.Touch) {
                me.initMeta();
            }

            Ext.on("resize", me.handleViewportResize, me);
        }
    }
}, function () {
    this.prototype.apply = function (target) {
        Ext.plugin.Viewport.apply(target);
        (target.prototype || target).setupViewport = Ext.net.plugin.Viewport.setupViewport;
    };
});

Ext.define('Ext.net.Viewport', {
    extend: 'Ext.container.Container',

    requires: [
        'Ext.net.plugin.Viewport'
    ],

    alias: 'widget.netviewport'
},
function () {
    Ext.plugin.Viewport.decorate(this);
    this.prototype.setupViewport = Ext.net.plugin.Viewport.setupViewport;
});