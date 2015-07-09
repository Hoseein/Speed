/*
 * @version   : 2.5.3 - Ext.NET Pro License
 * @author    : Ext.NET, Inc. http://www.ext.net/
 * @date      : 2014-10-30
 * @copyright : Copyright (c) 2008-2014, Ext.NET, Inc. (http://www.ext.net/). All rights reserved.
 * @license   : See license.txt and http://www.ext.net/license/.
 */





Ext.define('Ext.ux.grid.menu.ListMenu', {
    extend: 'Ext.menu.Menu',
    
    
    idField :  'id',

    
    labelField :  'text',
    
    loadingText : 'Loading...',
    
    loadOnShow : true,
    
    single : false,

    plain: true,

    constructor : function (cfg) {
        var me = this,
            options,
            i,
            len,
            value;
            
        me.selected = [];
        me.addEvents(
            
            'checkchange'
        );

        me.callParent(arguments);

        // A ListMenu which is completely unconfigured acquires its store from the unique values of its field in the store
        if (!me.store && !me.options) {
            me.options = me.grid.store.collect(me.dataIndex, false, true);
        }

        if(!me.store && me.options) {
            options = [];
            for(i = 0, len = me.options.length; i < len; i++){
                value = me.options[i];
                switch (Ext.type(value)) {
                    case 'array': 
                        options.push(value);
                        break;
                    case 'object':
                        options.push([value[me.idField], value[me.labelField]]);
                        break;
                    default:
                        if (value != null) {
                            options.push([value, value]);
                        }
                }
            }

            me.store = Ext.create('Ext.data.ArrayStore', {
                fields: [me.idField, me.labelField],
                data:   options,
                listeners: {
                    load: me.onLoad,
                    scope:  me
                }
            });
            me.loaded = true;
            me.autoStore = true;
        } else {
            this.store = Ext.data.StoreManager.lookup(this.store);
            
            if(this.store.getCount() > 0) {
                this.onLoad(this.store, this.store.getRange());
            } 
            else {
                this.add({text: this.loadingText, iconCls: 'loading-indicator'});            
                this.store.on('load', this.onLoad, this);
            }
        }
    },

    destroy : function () {
        var me = this,
            store = me.store;
            
        if (store) {
            if (me.autoStore) {
                store.destroyStore();
            } else {
                store.un('unload', me.onLoad, me);
            }
        }
        me.callParent();
    },

    
    show : function () {
        var me = this;
        if (me.loadOnShow && !me.loaded && !me.store.loading) {
            me.store.load();
        }
        me.callParent();
    },

    
    onLoad : function (store, records) {
        var me = this,
            gid, itemValue, i, len,
            listeners = {
                checkchange: me.checkChange,
                scope: me
            };

        Ext.suspendLayouts();
        me.removeAll(true);

        gid = me.single ? Ext.id() : null;
        for (i = 0, len = records.length; i < len; i++) {
            itemValue = records[i].get(me.idField);
            me.add(Ext.create('Ext.menu.CheckItem', {
                text: records[i].get(me.labelField),
                group: gid,
                checked: Ext.Array.contains(me.selected, itemValue),
                hideOnClick: false,
                value: itemValue,
                listeners: listeners
            }));
        }

        me.loaded = true;
        Ext.resumeLayouts(true);
        me.fireEvent('load', me, records);
    },

    
    getSelected : function () {
        return this.selected;
    },

    
    setSelected : function (value) {
        value = this.selected = [].concat(value);

        if (this.loaded) {
            this.items.each(function(item){
                item.setChecked(false, true);
                for (var i = 0, len = value.length; i < len; i++) {
                    if (item.value == value[i]) {
                        item.setChecked(true, true);
                    }
                }
            }, this);
        }
        else {
            this.on("load", Ext.Function.bind(this.setSelected, this, [value]), this, {single : true});
        }
    },

    
    checkChange : function (item, checked) {
        var value = [];
        this.items.each(function(item){
            if (item.checked) {
                value.push(item.value);
            }
        },this);
        this.selected = value;

        this.fireEvent('checkchange', item, checked);
    }
});




Ext.define('Ext.ux.grid.menu.RangeMenu', {
    extend: 'Ext.menu.Menu',

    
    fieldCls : 'Ext.form.field.Number',

    

    

    
    itemIconCls : {
        gt : 'ux-rangemenu-gt',
        lt : 'ux-rangemenu-lt',
        eq : 'ux-rangemenu-eq'
    },

    
    fieldLabels: {
        gt: 'Greater Than',
        lt: 'Less Than',
        eq: 'Equal To'
    },

    
    menuItemCfgs : {
        emptyText: 'Enter Number...',
        selectOnFocus: false,
        width: 155
    },

    
    menuItems : ['lt', 'gt', '-', 'eq'],

    plain: true,

    constructor : function (config) {
        var me = this,
            fields, fieldCfg, i, len, item, cfg, Cls;

        me.callParent(arguments);

        fields = me.fields = me.fields || {};
        fieldCfg = me.fieldCfg = me.fieldCfg || {};
        
        me.addEvents(
            
            'update'
        );
      
        me.updateTask = Ext.create('Ext.util.DelayedTask', me.fireUpdate, me);
    
        for (i = 0, len = me.menuItems.length; i < len; i++) {
            item = me.menuItems[i];

            if (item !== '-') {
                // defaults
                cfg = {
                    itemId: 'range-' + item,
                    enableKeyEvents: true,
                    hideEmptyLabel: false,
                    labelCls: 'ux-rangemenu-icon ' + me.itemIconCls[item],
                    labelSeparator : '',
                    labelWidth     : 29,                    
                    listeners  : {
                        scope  : me,
                        change : me.onInputChange,
                        keyup  : me.onInputKeyUp,
                        el: {
                            click: this.stopFn
                        }
                    },
                    activate   : Ext.emptyFn,
                    deactivate : Ext.emptyFn
                };
                Ext.apply(
                    cfg,
                    // custom configs
                    Ext.applyIf(fields[item] || {}, fieldCfg[item]),
                    // configurable defaults
                    me.menuItemCfgs
                );
                Cls = cfg.fieldCls || me.fieldCls;
                item = fields[item] = Ext.create(Cls, cfg);
            }
            me.add(item);
        }
    },

    stopFn: function(e) {
        e.stopPropagation();
    },

    
    fireUpdate : function () {
        this.fireEvent('update', this);
    },
    
    
    getValue : function () {
        var result = {},
            fields = this.fields, 
            key, field;
            
        for (key in fields) {
            if (fields.hasOwnProperty(key)) {
                field = fields[key];
                if (field.isValid() && field.getValue() !== null) {
                    result[key] = field.getValue();
                }
            }
        }
        return result;
    },
  
    	
    setValue : function (data) {
        var me = this,
            fields = me.fields,
            key,
            field;

        for (key in fields) {
            if (fields.hasOwnProperty(key)) {
                // Prevent field's change event from tiggering a Store filter. The final upate event will do that
                field =fields[key];
                field.suspendEvents();
                field.setValue(key in data ? data[key] : '');
                field.resumeEvents();
            }
        }

        // Trigger the filering of the Store
        me.fireEvent('update', me);
    },

    
    onInputKeyUp: function(field, e) {
        if (e.getKey() === e.RETURN && field.isValid()) {
            e.stopEvent();
            this.hide();
        }
    },

    
    onInputChange : function(field) {
        var me = this,
            fields = me.fields,
            eq = fields.eq,
            gt = fields.gt,
            lt = fields.lt;

        if (field == eq) {
            if (gt) {
                gt.setValue(null);
            }
            if (lt) {
                lt.setValue(null);
            }
        }
        else {
            eq.setValue(null);
        }

        // restart the timer
        this.updateTask.delay(this.updateBuffer);
    }
});




Ext.define('Ext.ux.grid.filter.Filter', {
    extend: 'Ext.util.Observable',

    
    active : false,
    
    
    dataIndex : null,
    
    menu : null,
    
    updateBuffer : 500,

    constructor : function (config) {
        Ext.apply(this, config);

        this.addEvents(
            
            'activate',
            
            'deactivate',
            
            'serialize',
            
            'update'
        );
        Ext.ux.grid.filter.Filter.superclass.constructor.call(this);

        this.menu = this.createMenu(config);
        this.init(config);

        if (config && Ext.isDefined(config.value)) {
            this.setValue(config.value);
            this.setActive(config.active !== false, true);
            delete config.value;
        }
    },

    
    destroy : function(){
        if (this.menu){
            this.menu.destroy();
        }

        this.clearListeners();
    },

    
    init : Ext.emptyFn,

    // Cleans up a menu's activate and deactivate events. The GitHub issue #321.
    cleanUpMenuEvents: function (cfg) {
        if (cfg.listeners) {
            delete cfg.listeners.activate;
            delete cfg.listeners.deactivate;
        }
    },

    
    createMenu : function(config) {
        cfg = Ext.clone(config);
        cfg.plain = true;
        this.cleanUpMenuEvents(cfg);

        return Ext.create('Ext.menu.Menu', cfg.menuItems ? { items: cfg.menuItems, plain: true } : cfg);
    },

    
    getValue : Ext.emptyFn,

    
    setValue : Ext.emptyFn,

    
    isActivatable : function(){
        return true;
    },

    
    getSerialArgs : Ext.emptyFn,

    
    validateRecord : function(){
        return true;
    },

    
    serialize : function(){
        var args = this.getSerialArgs();
        this.fireEvent('serialize', args, this);
        return args;
    },

    
    fireUpdate : function(){
        if (this.active) {
            this.fireEvent('update', this);
        }
        this.setActive(this.isActivatable());
    },

    
    setActive : function(active, suppressEvent) {
        if(this.active != active){
            this.active = active;
            if (suppressEvent !== true) {
                this.fireEvent(active ? 'activate' : 'deactivate', this);
            }
        }
    }
});




Ext.define('Ext.ux.grid.filter.BooleanFilter', {
    extend: 'Ext.ux.grid.filter.Filter',
    alias: 'gridfilter.boolean',

	
	defaultValue : false,
	
	yesText : 'Yes',
	
	noText : 'No',

    
    init : function (config) {
        var gId = Ext.id();
		this.options = [
			Ext.create('Ext.menu.CheckItem', {text: this.yesText, group: gId, checked: this.defaultValue === true}),
			Ext.create('Ext.menu.CheckItem', {text: this.noText, group: gId, checked: this.defaultValue === false})];

		this.menu.add(this.options[0], this.options[1]);

		for(var i=0; i<this.options.length; i++){
			this.options[i].on('click', this.fireUpdate, this);
			this.options[i].on('checkchange', this.fireUpdate, this);
		}
	},

    
    getValue : function () {
		return this.options[0].checked;
	},

    
	setValue : function (value) {
		this.options[value ? 0 : 1].setChecked(true);
	},

    
    getSerialArgs : function () {
		var args = {type: 'boolean', value: this.getValue()};
		return args;
	},

    
    validateRecord : function (record) {
		return record.get(this.dataIndex) == this.getValue();
	}
});




Ext.define('Ext.ux.grid.filter.DateFilter', {
    extend: 'Ext.ux.grid.filter.Filter',
    alias: 'gridfilter.date',
    uses: ['Ext.picker.Date', 'Ext.menu.Menu'],

    
    afterText : 'After',
    
    beforeText : 'Before',
    
    compareMap : {
        before: 'lt',
        after:  'gt',
        on:     'eq'
    },
    
    dateFormat : 'm/d/Y',

    submitFormat : "Y-m-d\\TH:i:s",

    
    
    
    menuItems : ['before', 'after', '-', 'on'],

    
    menuItemCfgs : {
        selectOnFocus: true,
        width: 125
    },

    
    onText : 'On',

    
    pickerOpts : {},

    
    init : function (config) {
        var me = this,
            pickerCfg, i, len, item, cfg;

        pickerCfg = Ext.apply(me.pickerOpts, {
            xtype: 'datepicker',
            minDate: me.minDate,
            maxDate: me.maxDate,
            format:  me.dateFormat,
            listeners: {
                scope: me,
                select: me.onMenuSelect
            }
        });

        me.fields = {};
        for (i = 0, len = me.menuItems.length; i < len; i++) {
            item = me.menuItems[i];
            if (item !== '-') {
                cfg = {
                    itemId: 'range-' + item,
                    text: me[item + 'Text'],
                    menu: Ext.create('Ext.menu.Menu', {
                        plain: true,
                        items: [
                            Ext.apply(pickerCfg, {
                                itemId: item,
                                listeners: {
                                    select: me.onPickerSelect,
                                    scope: me
                                }
                            })
                        ]
                    }),
                    listeners: {
                        scope: me,
                        checkchange: me.onCheckChange
                    }
                };
                item = me.fields[item] = Ext.create('Ext.menu.CheckItem', cfg);
            }
            //me.add(item);
            me.menu.add(item);
        }
        me.values = {};
    },

    onCheckChange : function (item, checked) {
        var me = this,
            picker = item.menu.items.first(),
            itemId = picker.itemId,
            values = me.values;

        if (checked) {
            values[itemId] = picker.getValue();
        } else {
            delete values[itemId]
        }
        me.setActive(me.isActivatable());
        me.fireEvent('update', me);
    },

    
    onInputKeyUp : function (field, e) {
        var k = e.getKey();
        if (k == e.RETURN && field.isValid()) {
            e.stopEvent();
            this.menu.hide();
        }
    },

    
    onMenuSelect : function (picker, date) {
        var fields = this.fields,
            field = this.fields[picker.itemId];

        field.setChecked(true);

        if (field == fields.on) {
            fields.before.setChecked(false, true);
            fields.after.setChecked(false, true);
        } else {
            fields.on.setChecked(false, true);
            if (field == fields.after && this.getFieldValue('before') < date) {
                fields.before.setChecked(false, true);
            } else if (field == fields.before && this.getFieldValue('after') > date) {
                fields.after.setChecked(false, true);
            }
        }
        this.fireEvent('update', this);

        picker.up('menu').hide();
    },

    
    getValue : function () {
        var key, result = {};
        for (key in this.fields) {
            if (this.fields[key].checked) {
                result[key] = this.getFieldValue(key);
            }
        }
        return result;
    },

    
    setValue : function (value, preserve) {
        var key;
        for (key in this.fields) {
            if(value[key]){
                this.getPicker(key).setValue(value[key]);
                this.fields[key].setChecked(true);
            } else if (!preserve) {
                this.fields[key].setChecked(false);
            }
        }
        this.fireEvent('update', this);
    },

    
    isActivatable : function () {
        var key;
        for (key in this.fields) {
            if (this.fields[key].checked) {
                return true;
            }
        }
        return false;
    },

    
    getSerialArgs : function () {
        var args = [];
        for (var key in this.fields) {
            if(this.fields[key].checked){
                args.push({
                    type: 'date',
                    comparison: this.compareMap[key],
                    value: Ext.Date.format(this.getFieldValue(key), this.submitFormat)
                });
            }
        }
        return args;
    },

    
    getFieldValue : function(item){
        return this.values[item];
    },

    
    getPicker : function(item){
        return this.fields[item].menu.items.first();
    },

    
    validateRecord : function (record) {
        var key,
            pickerValue,
            val = record.get(this.dataIndex),
            clearTime = Ext.Date.clearTime;

        if(!Ext.isDate(val)){
            return false;
        }
        val = clearTime(val, true).getTime();

        for (key in this.fields) {
            if (this.fields[key].checked) {
                pickerValue = clearTime(this.getFieldValue(key), true).getTime();
                if (key == 'before' && pickerValue <= val) {
                    return false;
                }
                if (key == 'after' && pickerValue >= val) {
                    return false;
                }
                if (key == 'on' && pickerValue != val) {
                    return false;
                }
            }
        }
        return true;
    },

    onPickerSelect: function(picker, date) {
        // keep track of the picker value separately because the menu gets destroyed
        // when columns order changes.  We return this value from getValue() instead
        // of picker.getValue()
        var checkItem = this.fields[picker.itemId];
        if (checkItem.checked) {
            this.values[picker.itemId] = date;
            this.fireEvent('update', this);
        }
        else {
            checkItem.setChecked(true);
        }
    }
});




Ext.define('Ext.ux.grid.filter.ListFilter', {
    extend: 'Ext.ux.grid.filter.Filter',
    alias: 'gridfilter.list',

    
    
    phpMode : false,
    

    
    init : function (config) {
        this.dt = Ext.create('Ext.util.DelayedTask', this.fireUpdate, this);
    },

    
    createMenu: function (config) {
        var cfg = Ext.clone(config),
            menu;

        this.cleanUpMenuEvents(cfg);                
        menu = Ext.create('Ext.ux.grid.menu.ListMenu', Ext.applyIf(this.menuConfig || {}, cfg));
        menu.on('checkchange', this.onCheckChange, this);

        return menu;
    },

    
    getValue : function () {
        return this.menu.getSelected();
    },
    
    setValue : function (value) {
        this.menu.setSelected(value);
        this.fireEvent('update', this);
    },

    
    isActivatable : function () {
        return this.getValue().length > 0;
    },

    
    getSerialArgs : function () {
        return {type: 'list', value: this.phpMode ? this.getValue().join(',') : this.getValue()};
    },

    
    onCheckChange : function(){
        this.dt.delay(this.updateBuffer);
    },


    
    validateRecord : function (record) {
        var valuesArray = this.getValue();
        return Ext.Array.indexOf(valuesArray, record.get(this.dataIndex)) > -1;
    }
});




Ext.define('Ext.ux.grid.filter.NumericFilter', {
    extend: 'Ext.ux.grid.filter.Filter',
    alias: 'gridfilter.numeric',
    uses: ['Ext.form.field.Number'],

    
    createMenu: function(config) {
        var me = this,
            menuCfg = config.menuItems ? {items : config.menuItems} : {},
            menu;
            
        if(Ext.isDefined(config.emptyText)){
            menuCfg.menuItemCfgs = {
                emptyText: config.emptyText,
                selectOnFocus: false,
                width: 155
            };
        }
            
        menu = Ext.create('Ext.ux.grid.menu.RangeMenu', menuCfg);
        menu.on('update', me.fireUpdate, me);
        return menu;
    },

    
    getValue : function () {
        return this.menu.getValue();
    },

    
    setValue : function (value) {
        this.menu.setValue(value);
    },

    
    isActivatable : function () {
        var values = this.getValue(),
            key;
        for (key in values) {
            if (values[key] !== undefined) {
                return true;
            }
        }
        return false;
    },

    
    getSerialArgs : function () {
        var key,
            args = [],
            values = this.menu.getValue();
        for (key in values) {
            args.push({
                type: 'numeric',
                comparison: key,
                value: values[key]
            });
        }
        return args;
    },

    
    validateRecord : function (record) {
        var val = record.get(this.dataIndex),
            values = this.getValue(),
            isNumber = Ext.isNumber;
        if (isNumber(values.eq) && val != values.eq) {
            return false;
        }
        if (isNumber(values.lt) && val >= values.lt) {
            return false;
        }
        if (isNumber(values.gt) && val <= values.gt) {
            return false;
        }
        return true;
    }
});




Ext.define('Ext.ux.grid.filter.StringFilter', {
    extend: 'Ext.ux.grid.filter.Filter',
    alias: 'gridfilter.string',

    
    iconCls : 'ux-gridfilter-text-icon',

    emptyText: 'Enter Filter Text...',
    selectOnFocus: true,
    width: 125,

    
    init : function (config) {
        delete config.listeners;
        Ext.applyIf(config, {
            enableKeyEvents: true,
            labelCls: 'ux-rangemenu-icon ' + this.iconCls,
            hideEmptyLabel: false,
            labelSeparator: '',
            labelWidth: 29,
            listeners: {
                scope: this,
                keyup: this.onInputKeyUp,
                el: {
                    click: function(e) {
                        e.stopPropagation();
                    }
                }
            }
        });
 
        this.inputItem = Ext.create('Ext.form.field.Text', config);
        this.menu.add(this.inputItem);
        this.menu.showSeparator = false;
        this.updateTask = Ext.create('Ext.util.DelayedTask', this.fireUpdate, this);
    },

    
    getValue : function () {
        return this.inputItem.getValue();
    },

    
    setValue : function (value) {
        this.inputItem.setValue(value);
        this.fireEvent('update', this);
    },

    
    isActivatable : function () {
        return this.inputItem.getValue().length > 0;
    },

    
    getSerialArgs : function () {
        return {type: 'string', value: this.getValue()};
    },

    
    validateRecord : function (record) {
        var val = record.get(this.dataIndex);

        if(typeof val != 'string') {
            return (this.getValue().length === 0);
        }

        return val.toLowerCase().indexOf(this.getValue().toLowerCase()) > -1;
    },

    
    onInputKeyUp : function (field, e) {
        var k = e.getKey();
        if (k == e.RETURN && field.isValid()) {
            e.stopEvent();
            this.menu.hide();
            return;
        }
        // restart the timer
        this.updateTask.delay(this.updateBuffer);
    }
});



Ext.define('Ext.ux.grid.FiltersFeature', {
    extend : 'Ext.grid.feature.Feature',
    alias  : 'feature.filters',
    uses   : [
        'Ext.ux.grid.menu.ListMenu',
        'Ext.ux.grid.menu.RangeMenu',
        'Ext.ux.grid.filter.BooleanFilter',
        'Ext.ux.grid.filter.DateFilter',
        'Ext.ux.grid.filter.ListFilter',
        'Ext.ux.grid.filter.NumericFilter',
        'Ext.ux.grid.filter.StringFilter'
    ],

    mixins: {
        observable: 'Ext.util.Observable'
    },

    isGridFiltersPlugin : true,

    
    autoReload : true,
    
     encode : true,
    
    
    filterCls : 'ux-filtered-column',
    
    local : false,
    
    menuFilterText : 'Filters',
    
    paramPrefix : 'filter',
    
    showMenu : true,
    
    stateId : undefined,
    
    updateBuffer : 500,

    // doesn't handle grid body events
    hasFeatureEvent: false,


    
    constructor : function (config) {
        var me = this;

        me.callParent(arguments);

        me.deferredUpdate = Ext.create('Ext.util.DelayedTask', me.reload, me);

        // Init filters
        me.filters = me.createFiltersCollection();
        me.filterConfigs = config.filters;
    },

    init: function(grid) {
        var me = this,
            view = me.view,
            headerCt = view.headerCt;

        me.bindStore(view.getStore(), true);

        // Listen for header menu being created
        headerCt.on('menucreate', me.onMenuCreate, me);

        view.on('refresh', me.onRefresh, me);
        grid.on({
            scope: me,
            beforestaterestore: me.applyState,
            beforestatesave: me.saveState,
            beforedestroy: me.destroy
        });

        // Add event and filters shortcut on grid panel
        grid.filters = me;
        me.addEvents('filterupdate');

        me.mixins.observable.constructor.call(me);
    },

    ensureFilters : function () {
        if (this.view && this.view.headerCt && !this.view.headerCt.menu) {
            this.view.headerCt.getMenu();
        }
    },

    createFiltersCollection: function () {
        return Ext.create('Ext.util.MixedCollection', false, function (o) {
            return o ? o.dataIndex : null;
        });
    },

    
    createFilters: function() {
        var me = this,
            hadFilters = me.filters.getCount(),
            grid = me.getGridPanel(),
            filters = me.createFiltersCollection(),
            model = grid.store.model,
            fields = model.prototype.fields,
            field,
            filter,
            state;

        if (hadFilters) {
            state = {};
            me.saveState(null, state);
        }

        function add (dataIndex, config, filterable) {
            if (dataIndex && (filterable || config)) {
                field = fields.get(dataIndex);
                filter = {
                    dataIndex: dataIndex,
                    type: (field && field.type && field.type.type) || 'auto'
                };

                if (Ext.isObject(config)) {
                    Ext.apply(filter, config);
                }

                filters.replace(filter);
            }
        }

        // We start with filters from our config and then merge on filters from the columns
        // in the grid. The Grid columns take precedence.
        Ext.Array.each(me.filterConfigs, function (filterConfig) {
            add(filterConfig.dataIndex, filterConfig);
        });

        Ext.Array.each(grid.columnManager.getColumns(), function (column) {
            if (column.filterable === false) {
                filters.removeAtKey(column.dataIndex);
            } else {
                add(column.dataIndex, column.filter, column.filterable);
            }
        });

        me.removeAll();
        if (filters.items) {
            me.initializeFilters(filters.items);
        }

        if (hadFilters) {
            me.applyState(null, state);
        }
    },

    
    initializeFilters: function(filters) {
        var me = this,
            filtersLength = filters.length,
            i, filter, FilterClass;

        for (i = 0; i < filtersLength; i++) {
            filter = filters[i];
            if (filter) {
                FilterClass = me.getFilterClass(filter.type);
                filter = filter.menu ? filter : new FilterClass(Ext.apply({
                    grid: me.grid
                }, filter));
                me.filters.add(filter);
                Ext.util.Observable.capture(filter, this.onStateChange, this);
            }
        }
    },

    
    onMenuCreate: function(headerCt, menu) {
        var me = this;
        me.createFilters();
        menu.on('beforeshow', me.onMenuBeforeShow, me);
    },

    
    onMenuBeforeShow: function(menu) {
        var me = this,
            menuItem, filter;

        if (me.showMenu) {
            menuItem = me.menuItem;
            if (!menuItem || menuItem.isDestroyed) {
                me.createMenuItem(menu);
                menuItem = me.menuItem;
            }

            filter = me.getMenuFilter();

            if (filter) {
                menuItem.setMenu(filter.menu, false);
                menuItem.setChecked(filter.active);
                // disable the menu if filter.disabled explicitly set to true
                menuItem.setDisabled(filter.disabled === true);
            }
            menuItem.setVisible(!!filter);
            this.sep.setVisible(!!filter);
        }
    },


    createMenuItem: function(menu) {
        var me = this;
        me.sep  = menu.add('-');
        me.menuItem = menu.add({
            checked: false,
            itemId: 'filters',
            text: me.menuFilterText,
            listeners: {
                scope: me,
                checkchange: me.onCheckChange,
                beforecheckchange: me.onBeforeCheck
            }
        });
    },

    getGridPanel: function() {
        return this.view.up('gridpanel');
    },

    
    applyState : function (grid, state) {
        var me = this,
            key, filter;
        me.applyingState = true;
        me.clearFilters();
        if (state.filters) {
            for (key in state.filters) {
                if (state.filters.hasOwnProperty(key)) {
                    filter = me.filters.get(key);
                    if (filter) {
                        filter.setValue(state.filters[key]);
                        filter.setActive(true);
                    }
                }
            }
        }
        me.deferredUpdate.cancel();
        if (me.local) {
            me.reload();
        }
        delete me.applyingState;
        delete state.filters;
    },

    
    saveState : function (grid, state) {
        var filters = {};
        this.filters.each(function (filter) {
            if (filter.active) {
                filters[filter.dataIndex] = filter.getValue();
            }
        });
        return (state.filters = filters);
    },

    
    destroy : function () {
        var me = this;
        Ext.destroyMembers(me, 'menuItem', 'sep');
        me.removeAll();
        me.clearListeners();
    },

    
    removeAll : function () {
        if(this.filters){
            Ext.destroy.apply(Ext, this.filters.items);
            // remove all items from the collection
            this.filters.clear();
        }
    },


    
    bindStore : function(store) {
        var me = this;

        // Unbind from the old Store
        if (me.store && me.storeListeners) {
            me.store.un(me.storeListeners);
        }

        // Set up correct listeners
        if (store) {
            me.storeListeners = {
                scope: me
            };
            if (me.local) {
                me.storeListeners.load = me.onLoad;
            } else {
                me.storeListeners['before' + (store.buffered ? 'prefetch' : 'load')] = me.onBeforeLoad;
            }
            store.on(me.storeListeners);
        } else {
            delete me.storeListeners;
        }
        me.store = store;
    },


    
    getMenuFilter : function () {
        var header = this.view.headerCt.getMenu().activeHeader;
        return header ? this.filters.get(header.dataIndex) : null;
    },

    
    onCheckChange : function (item, value) {
        this.getMenuFilter().setActive(value);
    },

    
    onBeforeCheck : function (check, value) {
        return !value || this.getMenuFilter().isActivatable();
    },

    
    onStateChange : function (event, filter) {
        if (event !== 'serialize') {
            var me = this,
                grid = me.getGridPanel();

            if (filter == me.getMenuFilter()) {
                me.menuItem.setChecked(filter.active, false);
            }

            if ((me.autoReload || me.local) && !me.applyingState) {
                me.deferredUpdate.delay(me.updateBuffer);
            }
            me.updateColumnHeadings();

            if (!me.applyingState) {
                grid.saveState();
            }
            this.fireEvent('filterupdate', me, filter);
        }
    },

    
    onBeforeLoad : function (store, options) {
        if(!options){
            return;
        }
        this.ensureFilters();
        options.params = options.params || {};
        this.cleanParams(options.params);
        var params = this.buildQuery(this.getFilterData());
        Ext.apply(options.params, params);
    },

    
    onLoad : function (store, options) {
        store.filterBy(this.getRecordFilter());
    },

    
    onRefresh : function () {
        this.updateColumnHeadings();
    },

    
    updateColumnHeadings : function () {
        var me = this,
            headerCt = me.view.headerCt;
        if (headerCt) {
            headerCt.cascade(function(header) {
                var filter = me.getFilter(header.dataIndex);
                header[filter && filter.active ? 'addCls' : 'removeCls'](me.filterCls);
            });
        }
    },

    
    reload : function () {
        var me = this,
            store = me.view.getStore();

        if (me.local) {
            store.clearFilter(true);
            store.filterBy(me.getRecordFilter());
            store.sort();
        } else {
            me.deferredUpdate.cancel();

            if (store.buffered) {
                store.data.clear();
            }

            store.loadPage(1);
        }
    },

    
    getRecordFilter : function () {
        var f = [], len, i,
            lockingPartner = this.lockingPartner;
        this.filters.each(function (filter) {
            if (filter.active) {
                f.push(filter);
            }
        });

        // Be sure to check the active filters on a locking partner as well.
        if (lockingPartner) {
            lockingPartner.filters.each(function (filter) {
                if (filter.active) {
                    f.push(filter);
                }
            });
        }

        len = f.length;

        return function (record) {
            for (i = 0; i < len; i++) {
                if (!f[i].validateRecord(record)) {
                    return false;
                }
            }
            return true;
        };
    },

    
    addFilter : function (config) {
        var me = this,
            columns = me.getGridPanel().columnManager.getColumns(),
            i, columnsLength, column, filtersLength, filter;

        
        for (i = 0, columnsLength = columns.length; i < columnsLength; i++) {
            column = columns[i];
            if (column.dataIndex === config.dataIndex) {
                column.filter = config;
            }
        }
        
        if (me.view.headerCt.menu) {
            me.createFilters();
        } else {
            // Call getMenu() to ensure the menu is created, and so, also are the filters. We cannot call
            // createFilters() withouth having a menu because it will cause in a recursion to applyState()
            // that ends up to clear all the filter values. This is likely to happen when we reorder a column
            // and then add a new filter before the menu is recreated.
            me.view.headerCt.getMenu();
        }
        
        for (i = 0, filtersLength = me.filters.items.length; i < filtersLength; i++) {
            filter = me.filters.items[i];
            if (filter.dataIndex === config.dataIndex) {
                return filter;
            }
        }
    },

    
    addFilters : function (filters) {
        if (filters) {
            var me = this,
                i, filtersLength;
            for (i = 0, filtersLength = filters.length; i < filtersLength; i++) {
                me.addFilter(filters[i]);
            }
        }
    },

    
    getFilter : function (dataIndex) {
        this.ensureFilters();        
        return this.filters.get(dataIndex);
    },

    
    clearFilters : function () {
        this.filters.each(function (filter) {
            filter.setActive(false);
        });
    },

    getFilterItems: function () {
        var me = this;

        // If there's a locked grid then we must get the filter items for each grid.
        if (me.lockingPartner) {
            return me.filters.items.concat(me.lockingPartner.filters.items);
        }

        return me.filters.items;
    },

    
    getFilterData : function () {
        var items = this.getFilterItems(),
            filters = [],
            n, nlen, item, d, i, len;

        for (n = 0, nlen = items.length; n < nlen; n++) {
            item = items[n];
            if (item.active) {
                d = [].concat(item.serialize());
                for (i = 0, len = d.length; i < len; i++) {
                    filters.push({
                        field: item.dataIndex,
                        data: d[i]
                    });
                }
            }
        }
        return filters;
    },

    
    buildQuery : function (filters) {
        if(this.view.getStore().proxy && this.view.getStore().proxy.isODataProxy) {
            return this.buildQueryOdata(filters);
        }
        
        var p = {}, i, f, root, dataPrefix, key, tmp,
            len = filters.length;

        if (!this.encode){
            for (i = 0; i < len; i++) {
                f = filters[i];
                root = [this.paramPrefix, '[', i, ']'].join('');
                p[root + '[field]'] = f.field;

                dataPrefix = root + '[data]';
                for (key in f.data) {
                    p[[dataPrefix, '[', key, ']'].join('')] = f.data[key];
                }
            }
        } else {
            tmp = [];
            for (i = 0; i < len; i++) {
                f = filters[i];
                tmp.push(Ext.apply(
                    {},
                    {field: f.field},
                    f.data
                ));
            }
            // only build if there is active filter
            if (tmp.length > 0){
                p[this.paramPrefix] = Ext.JSON.encode(tmp);
            }
        }
        return p;
    },

    buildQueryOdata : function (filters) {
        var p = {}, 
            i, 
            f, 
            dataPrefix,
            len = filters.length,
            odata = "",
            value;
 
        for (i = 0; i < len; i++) {
            f = filters[i];
 
            if (odata != "") {
                odata += " and ";
            }

            if(f.data.type == "list") {                
                Ext.each(f.data.value, function (v, index){
                    value = "'" + v + "'";
                    if (index>0) {
                        odata += " or ";
                    }
                    else {
                        odata += "(";
                    }
                    odata += "substringof(" + value + "," + f.field + ") eq true";

                    if (index == (f.data.value.length - 1)) {
                        odata += ")";
                    }
                });
            }
            else {
                value = (f.data.type == "string" || f.data.type == "date") ? "'" + f.data.value + "'" : f.data.value;
                if(f.data.type == "date"){
                    value = "datetime"+value;
                }

                if (f.data.comparison != null) {
                    odata += f.field + " " + f.data.comparison + " " + value;
                } else {                
                    odata += "substringof(" + value + "," + f.field + ") eq true";
                }
            }                            
        } 
        
        if (odata != "") {
            p["$filter"] = odata;
        }

        return p;            
    },

    
    cleanParams : function (p) {
        // if encoding just delete the property
        if (this.encode) {
            delete p[this.paramPrefix];
        // otherwise scrub the object of filter data
        } else {
            var regex, key;
            regex = new RegExp('^' + this.paramPrefix + '\[[0-9]+\]');
            for (key in p) {
                if (regex.test(key)) {
                    delete p[key];
                }
            }
        }
    },

    
    getFilterClass : function (type) {
        // map the supported Ext.data.Field type values into a supported filter
        switch(type) {
            case 'auto':
              type = 'string';
              break;
            case 'int':
            case 'float':
              type = 'numeric';
              break;
            case 'bool':
              type = 'boolean';
              break;
        }

        return Ext.ClassManager.getByAlias('gridfilter.' + type);
    }
});

Ext.ux.grid.FiltersFeature.override(Ext.util.DirectObservable);


Ext.define('Ext.ux.form.MultiSelect', {
    
    extend: 'Ext.form.FieldContainer',
    
    mixins: {
        bindable: 'Ext.util.Bindable',
        field: 'Ext.form.field.Field'    
    },
    
    alternateClassName: 'Ext.ux.Multiselect',
    alias: ['widget.multiselectfield', 'widget.multiselect'],
    
    requires: ['Ext.panel.Panel', 'Ext.view.BoundList', 'Ext.layout.container.Fit'],
    
    uses: ['Ext.view.DragZone', 'Ext.view.DropZone'],
    
    layout: 'anchor',
    
    

    

    

    
    ddReorder: false,

    

    
    appendOnly: false,

    
    displayField: 'text',

    

    
    allowBlank: true,

    
    minSelections: 0,

    
    maxSelections: Number.MAX_VALUE,

    
    blankText: 'This field is required',

    
    minSelectionsText: 'Minimum {0} item(s) required',
    
    
    maxSelectionsText: 'Maximum {0} item(s) required',

    
    delimiter: ',',

    dragText: '{0} Item{1}',

    

    ignoreSelectChange: 0,
    useHiddenField : true,

    multiSelect  : false,
    singleSelect : false,
    simpleSelect : true,
    simpleSubmit : false,
    showCheckbox : false,

    getHiddenStateName : function () {
        return this.getName();
    },

    isItemsReady : function () {
        return !!this.boundList;
    },

    getSubmitArray : function () {
        if(!this.isItemsReady()){
            return [];
        }

        var state = [],
            valueModels = this.getRecordsForValue(this.getValue());

        if(!valueModels || valueModels.length == 0){
            return state;
        }

        Ext.each(valueModels, function(model){
            state.push({
                value : model.get(this.valueField),
                text : model.get(this.displayField),
                index : this.store.indexOf(model)
            });
        }, this);

        return state;
    },

    getValues : function(full){
        var records = this.store.getRange() || [],
            record,
            values = [];
        
        for (var i = 0; i < records.length; i++) {
            record = records[i];
            values.push(full ? {
                value : record.get(this.valueField),
                text : record.get(this.displayField),
                index : i
            } : {value: record.get(this.valueField)});
        }

        return values;
    },

    getHiddenState : function (value) {
        if (this.simpleSubmit) {
            return this.getValue();
        }

        var state = this.getSubmitArray();
        
        return state.length > 0 ? Ext.encode(state) : "";
    },

    // private
    initComponent: function(){
        var me = this;

        me.bindStore(me.store, true);
        if (me.store.autoCreated) {
            me.valueField = me.displayField = 'field1';
            if (!me.store.expanded) {
                me.displayField = 'field2';
            }
        }

        if (!Ext.isDefined(me.valueField)) {
            me.valueField = me.displayField;
        }
        me.items = me.setupItems();

        me.callParent();
        me.initField();
        me.addEvents('beforedrop', 'drop');    

        if (Ext.net.ResourceMgr.isMVC) {
			this.includeHiddenStateToSubmitData = !this.simpleSubmit;
		}
    },
    
    setupItems: function() {
        var me = this,
            config = {
                anchor: 'none 100%',
                deferInitialRefresh: false,
	            border: 1,
                multiSelect: this.multiSelect,
                singleSelect: this.singleSelect,
                simpleSelect: (this.multiSelect || this.singleSelect) ? false : this.simpleSelect,
                displayField: me.displayField,
                store: me.store,
                disabled: me.disabled
            };

        if (me.showCheckbox) {
            config.cls = "x-multiselect-with-checkbox";

            if (me.listConfig && me.listConfig.cls) {
                config.cls += " " + me.listConfig.cls;
                delete me.listConfig.cls;
            }
        }

        me.boundList = Ext.create('Ext.view.BoundList', Ext.apply(config, me.listConfig));
                
        me.boundList.getSelectionModel().on('selectionchange', me.onSelectChange, me);
        
        // Only need to wrap the BoundList in a Panel if we have a title.
        if (!me.title) {
            me.boundList.border = this.border;
            return me.boundList;
        }

        // Wrap to add a title
        me.boundList.border = false;

        return {
	        border: this.border,
            anchor: 'none 100%',
            layout: 'anchor',
            title: me.title,
            tbar: me.tbar,
            items: me.boundList
        };
    },
    
    onSelectChange: function(selModel, selections){
        if (!this.ignoreSelectChange) {
            this.setValue(selections);
        }    
    },
    
    getSelected: function(){
        return this.boundList.getSelectionModel().getSelection();
    },
    
    // compare array values
    isEqual: function(v1, v2) {
        var fromArray = Ext.Array.from,
            i = 0, 
            len;

        v1 = fromArray(v1);
        v2 = fromArray(v2);
        len = v1.length;

        if (len !== v2.length) {
            return false;
        }

        for(; i < len; i++) {
            if (v2[i] !== v1[i]) {
                return false;
            }
        }

        return true;
    },

    // private
    afterRender: function() {
        var me = this;
        me.callParent();
	
	if (!Ext.isEmpty(this.selectedItems) && this.store) {
            this.setInitValue(this.selectedItems);
        }

        if (me.ddReorder && !me.dragGroup && !me.dropGroup){
            me.dragGroup = me.dropGroup = 'MultiselectDD-' + Ext.id();
        }

        if (me.draggable || me.dragGroup){
            me.dragZone = Ext.create('Ext.view.DragZone', {
                view: me.boundList,
                ddGroup: me.dragGroup,
                dragText: me.dragText
            });
        }
        if (me.droppable || me.dropGroup){
            me.dropZone = Ext.create('Ext.view.DropZone', {
                view: me.boundList,
                ddGroup: me.dropGroup,
                handleNodeDrop: function(data, dropRecord, position) {
                    if (me.fireEvent('beforedrop', me, data, dropRecord, position) === false) {
                        return false;
                    }

                    var view = this.view,
                        store = view.getStore(),
                        records = data.records,
                        copyRecords,
                        index;

                    
                    if(data.view.ownerCt.copy){
                       copyRecords = [];
                       Ext.each(records, function(record){
                          copyRecords.push(record.copy());
                       });
                       records = copyRecords;
                    }else{
                        // remove the Models from the source Store
                        data.view.store.remove(records);
                    }                    
                    

                    index = store.indexOf(dropRecord);

                    if (position === 'after') {
                        index++;
                    }

                    store.insert(index, records);
                    view.getSelectionModel().select(records);
                    me.fireEvent('drop', me, records);
                }
            });
        }
    },
    
    isValid : function() {
        var me = this,
            disabled = me.disabled,
            validate = me.forceValidation || !disabled;
            
        
        return validate ? me.validateValue(me.value) : disabled;
    },
    
    validateValue: function(value) {
        var me = this,
            errors = me.getErrors(value),
            isValid = Ext.isEmpty(errors);
            
        if (!me.preventMark) {
            if (isValid) {
                me.clearInvalid();
            } else {
                me.markInvalid(errors);
            }
        }

        return isValid;
    },
    
    markInvalid : function(errors) {
        // Save the message and fire the 'invalid' event
        var me = this,
            oldMsg = me.getActiveError();
        me.setActiveErrors(Ext.Array.from(errors));
        if (oldMsg !== me.getActiveError()) {
            me.updateLayout();
        }
    },

    
    clearInvalid : function() {
        // Clear the message and fire the 'valid' event
        var me = this,
            hadError = me.hasActiveError();
        me.unsetActiveError();
        if (hadError) {
            me.updateLayout();
        }
    },
    
    getSubmitData: function() {
        var me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue) {
            val = me.getSubmitValue();
            if (val !== null) {
                data = {};
                data[me.getName()] = val;
            }
        }
        return data;
    },

    
    getSubmitValue: function() {
        var me = this,
            delimiter = me.delimiter,
            val = me.getValue();
        return Ext.isString(delimiter) ? val.join(delimiter) : val;
    },
    
    getValue: function(){
        return this.value || [];
    },
    
    getRecordsForValue: function(value){
        var me = this,
            records = [],
            all = me.store.getRange(),
            valueField = me.valueField,
            i = 0,
            allLen = all.length,
            rec,
            j,
            valueLen;

        value = value || [];
            
        for (valueLen = value.length; i < valueLen; ++i) {
            for (j = 0; j < allLen; ++j) {
                rec = all[j];   
                if (rec.get(valueField) == value[i]) {
                    records.push(rec);
                }
            }    
        }
            
        return records;
    },
    
    setupValue: function(value){
        var delimiter = this.delimiter,
            valueField = this.valueField,
            i = 0,
            out,
            len,
            item;
            
        if (Ext.isDefined(value)) {
            if (delimiter && Ext.isString(value)) {
                value = value.split(delimiter);
            } else if (!Ext.isArray(value)) {
                value = [value];
            }
        
            for (len = value.length; i < len; ++i) {
                item = value[i];
                if (item && item.isModel) {
                    value[i] = item.get(valueField);
                }
            }
            out = Ext.Array.unique(value);
        } else {
            out = [];
        }
        return out;
    },
    
    setValue: function(value){
        var me = this,
            rs,
            selModel = me.boundList.getSelectionModel(),
            originalPreventFocus;

        // Store not loaded yet - we cannot set the value
        if (!me.store.getCount()) {
            me.store.on({
                load: Ext.Function.bind(me.setValue, me, [value]),
                single: true
            });
            return;
        }
        
        value = me.setupValue(value);
        me.mixins.field.setValue.call(me, value);
        
        if (me.rendered) {
            originalPreventFocus = selModel.preventFocus;
            selModel.preventFocus = true;
            ++me.ignoreSelectChange;
            selModel.deselectAll();            
            rs = me.getRecordsForValue(value);
            if(rs.length > 0){
                selModel.select(rs);
            }
            --me.ignoreSelectChange;
            selModel.preventFocus = originalPreventFocus;
        } else {
            me.selectOnRender = true;
        }
    },
    
    clearValue: function(){
        this.setValue([]);    
    },
    
    onEnable: function(){
        var list = this.boundList;
        this.callParent();
        if (list) {
            list.enable();
        }
    },
    
    onDisable: function(){
        var list = this.boundList;
        this.callParent();
        if (list) {
            list.disable();
        }
    },

    getErrors : function(value) {
        var me = this,
            format = Ext.String.format,
            errors = [],
            numSelected;

        value = Ext.Array.from(value || me.getValue());
        numSelected = value.length;

        if (!me.allowBlank && numSelected < 1) {
            errors.push(me.blankText);
        }
        if (numSelected < me.minSelections) {
            errors.push(format(me.minSelectionsText, me.minSelections));
        }
        if (numSelected > me.maxSelections) {
            errors.push(format(me.maxSelectionsText, me.maxSelections));
        }

        return errors;
    },
    
    onDestroy: function(){
        var me = this;
        
        me.bindStore(null);
        Ext.destroy(me.dragZone, me.dropZone);
        me.callParent();
    },
    
    onBindStore: function(store){
        var boundList = this.boundList;
        
        if (boundList) {
            boundList.bindStore(store);
        }
    },

    setInitValue : function (value) {
        if (this.store.getCount() > 0) {
            this.setSelectedItems(value);
        } else {
            this.store.on("load", Ext.Function.bind(this.setSelectedItems, this, [value]), this, { single : true });
        }
    },

    findRecord: function(field, value) {
        var ds = this.store,
            idx = ds.findExact(field, value);
        return idx !== -1 ? ds.getAt(idx) : false;
    },
    findRecordByValue: function(value) {
        return this.findRecord(this.valueField, value);
    },
    findRecordByDisplay: function(value) {
        return this.findRecord(this.displayField, value);
    },

    setSelectedItems : function (items) {
        if(items){
            items = Ext.Array.from(items);

            if(!this.rendered){
                this.selectedItems = items;
                return;
            }
            
            var rec,
                values=[];

            Ext.each(items, function(item){
                if(Ext.isDefined(item.value)){
                    rec = this.findRecordByValue(item.value);
                    if(rec){                    
                        values.push(rec);
                    }
                }
                else if(Ext.isDefined(item.text)){
                    rec = this.findRecordByDisplay(item.text);
                    if(rec){                    
                        values.push(rec);
                    }
                }
                else if(Ext.isDefined(item.index)){
                    rec = this.store.getAt(item.index);
                    if(rec){
                        values.push(rec);
                    }
                }
            }, this);

            this.setValue(values);            
        }
    },

    afterLayout : function () {
        this.callParent(arguments);

        if(this.labelAlign == "top" && this.boundList)
        {
            Ext.suspendLayouts(); 
            var td = this.boundList.el.parent();
            this.boundList.el.setHeight(td.getHeight() - td.getBorderWidth("tb") - td.getPadding("tb"));
            Ext.resumeLayouts(); 
        }
    }
});




Ext.define('Ext.ux.form.ItemSelector', {
    extend: 'Ext.ux.form.MultiSelect',
    alias: ['widget.itemselectorfield', 'widget.itemselector'],
    alternateClassName: ['Ext.ux.ItemSelector'],
    requires: [
        'Ext.button.Button',
        'Ext.ux.form.MultiSelect'
    ],

    
    hideNavIcons:false,

    
    buttons: ['top', 'up', 'add', 'remove', 'down', 'bottom'],

    
    buttonsText: {
        top: "Move to Top",
        up: "Move Up",
        add: "Add to Selected",
        remove: "Remove from Selected",
        down: "Move Down",
        bottom: "Move to Bottom"
    },

    layout: {
        type: 'hbox',
        align: 'stretch'
    },

    initComponent: function() {
        var me = this;

        me.ddGroup = me.id + '-dd';
        me.callParent();

        // bindStore must be called after the fromField has been created because
        // it copies records from our configured Store into the fromField's Store
        me.bindStore(me.store);
    },

    createList: function(title){
        var me = this;

        return Ext.create('Ext.ux.form.MultiSelect', {
            // We don't want the multiselects themselves to act like fields,
            // so override these methods to prevent them from including
            // any of their values
            submitValue: false,
            useHiddenField : false,
            getSubmitData: function(){
                return null;
            },
            getModelData: function(){
                return null;    
            },
            flex: 1,
            border : 1,
            multiSelect: me.multiSelect,
            singleSelect: me.singleSelect,
            simpleSelect: me.simpleSelect,
            dragGroup: me.ddGroup,
            dropGroup: me.ddGroup,
            title: title,
            store: {
                model: me.store.model,
                data: []
            },
            displayField: me.displayField,
            valueField: me.valueField,
            disabled: me.disabled,
            listeners: {
                boundList: {
                    scope: me,
                    itemdblclick: me.onItemDblClick,
                    drop: me.syncValue
                }
            }
        });
    },

    isItemsReady : function () {
        return !!this.fromField;
    },

    setupItems: function() {
        var me = this;

        me.fromField = me.createList(me.fromTitle);
        me.toField = me.createList(me.toTitle);

        return [
            me.fromField,
            {
                xtype: 'container',
                margins: '0 4',
                layout: {
                    type: 'vbox',
                    pack: 'center'
                },
                items: me.createButtons()
            },
            me.toField
        ];
    },

    createButtons: function() {
        var me = this,
            buttons = [];

        if (!me.hideNavIcons) {
            Ext.Array.forEach(me.buttons, function(name) {
                buttons.push({
                    xtype: 'button',
                    tooltip: me.buttonsText[name],
                    handler: me['on' + Ext.String.capitalize(name) + 'BtnClick'],
                    cls: Ext.baseCSSPrefix + 'form-itemselector-btn',
                    iconCls: Ext.baseCSSPrefix + 'form-itemselector-' + name,
                    navBtn: true,
                    scope: me,
                    margin: '4 0 0 0'
                });
            });
        }
        return buttons;
    },

    
    getSelections: function(list) {
        var store = list.getStore();

        return Ext.Array.sort(list.getSelectionModel().getSelection(), function(a, b) {
            a = store.indexOf(a);
            b = store.indexOf(b);

            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        });
    },

    getSelected: function(){
        return this.getSelections(this.toField.boundList);
    },

    onTopBtnClick : function() {
        var list = this.toField.boundList,
            store = list.getStore(),
            selected = this.getSelections(list);

        store.suspendEvents();
        store.remove(selected, true);
        store.insert(0, selected);
        store.resumeEvents();
        list.refresh();
        this.syncValue(); 
        list.getSelectionModel().select(selected);
    },

    onBottomBtnClick : function() {
        var list = this.toField.boundList,
            store = list.getStore(),
            selected = this.getSelections(list);

        store.suspendEvents();
        store.remove(selected, true);
        store.add(selected);
        store.resumeEvents();
        list.refresh();
        this.syncValue();
        list.getSelectionModel().select(selected);
    },

    onUpBtnClick : function() {
        var list = this.toField.boundList,
            store = list.getStore(),
            selected = this.getSelections(list),
            rec,
            i = 0,
            len = selected.length,
            index = 0;

        // Move each selection up by one place if possible
        store.suspendEvents();
        for (; i < len; ++i, index++) {
            rec = selected[i];
            index = Math.max(index, store.indexOf(rec) - 1);
            store.remove(rec, true);
            store.insert(index, rec);
        }
        store.resumeEvents();
        list.refresh();
        this.syncValue();
        list.getSelectionModel().select(selected);
    },

    onDownBtnClick : function() {
        var list = this.toField.boundList,
            store = list.getStore(),
            selected = this.getSelections(list),
            rec,
            i = selected.length - 1,
            index = store.getCount() - 1;

        // Move each selection down by one place if possible
        store.suspendEvents();
        for (; i > -1; --i, index--) {
            rec = selected[i];
            index = Math.min(index, store.indexOf(rec) + 1);
            store.remove(rec, true);
            store.insert(index, rec);
        }
        store.resumeEvents();
        list.refresh();
        this.syncValue();
        list.getSelectionModel().select(selected);
    },

    onAddBtnClick : function() {
        var me = this,
            selected = me.getSelections(me.fromField.boundList);

        me.moveRec(true, selected);
        me.toField.boundList.getSelectionModel().select(selected);
    },

    onRemoveBtnClick : function() {
        var me = this,
            selected = me.getSelections(me.toField.boundList);

        me.moveRec(false, selected);
        me.fromField.boundList.getSelectionModel().select(selected);
    },

    moveRec: function(add, recs) {
        var me = this,
            fromField = me.fromField,
            toField   = me.toField,
            fromStore = add ? fromField.store : toField.store,
            toStore   = add ? toField.store   : fromField.store;

        fromStore.suspendEvents();
        toStore.suspendEvents();
        fromStore.remove(recs);
        toStore.add(recs);
        fromStore.resumeEvents();
        toStore.resumeEvents();

        fromField.boundList.refresh();
        toField.boundList.refresh();

        me.syncValue();
    },

    // Synchronizes the submit value with the current state of the toStore
    syncValue: function() {
        var me = this; 
        me.mixins.field.setValue.call(me, me.setupValue(me.toField.store.getRange()));
    },

    onItemDblClick: function(view, rec) {
        this.moveRec(view === this.fromField.boundList, rec);
    },

    setValue: function(value) {
        var me = this,
            fromField = me.fromField,
            toField = me.toField,
            fromStore = fromField.store,
            toStore = toField.store,
            selected;

        // Wait for from store to be loaded
        if (!me.fromStorePopulated) {
            me.fromField.store.on({
                load: Ext.Function.bind(me.setValue, me, [value]),
                single: true
            });
            return;
        }

        value = me.setupValue(value);
        me.mixins.field.setValue.call(me, value);

        selected = me.getRecordsForValue(value);

        // Clear both left and right Stores.
        // Both stores must not fire events during this process.
        fromStore.suspendEvents();
        toStore.suspendEvents();
        fromStore.removeAll();
        toStore.removeAll();

        // Reset fromStore
        me.populateFromStore(me.store);

        // Copy selection across to toStore
        Ext.Array.forEach(selected, function(rec){
            // In the from store, move it over
            if (fromStore.indexOf(rec) > -1) {
                fromStore.remove(rec);
            }
            toStore.add(rec);
        });

        // Stores may now fire events
        fromStore.resumeEvents();
        toStore.resumeEvents();

        // Refresh both sides and then update the app layout
        Ext.suspendLayouts();
        fromField.boundList.refresh();
        toField.boundList.refresh();
        Ext.resumeLayouts(true);        
    },

    onBindStore: function(store, initial) {
        var me = this;

        if (me.fromField) {
            me.fromField.store.removeAll();
            me.toField.store.removeAll();

            // Add everything to the from field as soon as the Store is loaded
            if (store.getCount()) {
                me.populateFromStore(store);
            } else {
                me.store.on('load', me.populateFromStore, me);
            }
        }
    },

    populateFromStore: function(store) {
        var fromStore = this.fromField.store;

        // Flag set when the fromStore has been loaded
        this.fromStorePopulated = true;

        this.fromField.store.removeAll();
        this.toField.store.removeAll();

        fromStore.add(store.getRange());

        // setValue waits for the from Store to be loaded
        fromStore.fireEvent('load', fromStore);
    },

    onEnable: function(){
        var me = this;

        me.callParent();
        me.fromField.enable();
        me.toField.enable();

        Ext.Array.forEach(me.query('[navBtn]'), function(btn){
            btn.enable();
        });
    },

    onDisable: function(){
        var me = this;

        me.callParent();
        me.fromField.disable();
        me.toField.disable();

        Ext.Array.forEach(me.query('[navBtn]'), function(btn){
            btn.disable();
        });
    },

    onDestroy: function(){
        this.bindStore(null);
        this.callParent();
    }
});

 
 Ext.net.TabMenu = Ext.extend(Object, {
    init : function (tabPanel) {
        this.tabPanel = tabPanel;        
        this.tabPanel.tabBar.onAdd = Ext.Function.createSequence(this.tabPanel.tabBar.onAdd, this.onAdd, this);
        
        this.tabPanel.tabBar.on({
            click    : this.onClick,
            element  : 'el',
            delegate : '.' + Ext.baseCSSPrefix + 'tab-strip-menu',
            scope    : this
        });


        if(Ext.isArray(this.tabPanel.items)){
            Ext.each(this.tabPanel.items, function(item){
                this.onAdd(item.tab);
            }, this);
        } else if(this.tabPanel.items && this.tabPanel.items.each){
            this.tabPanel.items.each(function(item){
                this.onAdd(item.tab);
            }, this);
        }

        
        this.tabPanel.addEvents("beforetabmenushow");
        
        var m;
        if (m = this.tabPanel.defaultTabMenu) {
            this.tabPanel.defaultTabMenu = m.render ? m : Ext.ComponentManager.create(m, "menu");
            this.tabPanel.on("beforedestroy", function(){
                if(this.defaultTabMenu){
                    this.defaultTabMenu.destroy();
                }
            }, this.tabPanel);
        }
    },

    onClick: function(e, target) {
        var tabTarget = e.getTarget('.' + Ext.baseCSSPrefix + 'tab'),            
            tab,
            tabPanel = this.tabPanel,        
            isMenu = e.getTarget(".x-tab-strip-menu"),
            menu;
            
        if (isMenu && tabTarget) {            
            tab = Ext.getCmp(tabTarget.id);
            menu = tab.card.tabMenu || tabPanel.defaultTabMenu;
            
            if (tabPanel.fireEvent("beforetabmenushow", tabPanel, tab.card, menu) === false) {
                return false;
            }
            
            menu.tab = tab.card;
            menu.showBy(tab.menuEl, "tl-bl?");            
        }
    },
    
    onAdd : function (tab) {
        if(!tab.rendered){
            tab.on("afterrender", this.onAdd, this, {single:true});
            return;
        }
        
        var m;

        if (m = tab.card.tabMenu) {
            tab.card.tabMenu = m.render ? m : Ext.ComponentManager.create(m, "menu");    
            tab.card.on("beforedestroy", function(){
                if(this.tabMenu){
                    this.tabMenu.destroy();
                }
            }, tab.card);
        }
        
        if ((tab.card.tabMenu || this.tabPanel.defaultTabMenu)) {            
            tab.addCls("x-tab-strip-withmenu");
            
            tab.menuEl = tab.el.createChild({
                tag : "span", 
                cls : "x-tab-strip-menu"
            }).on('click', Ext.EventManager.preventDefault);;
            
            if (tab.card.tabMenuHidden === true) {
                tab.menuEl.hide();
            }
            
            tab.card.hideTabMenu = Ext.Function.bind(this.hideTabMenu,tab);
            tab.card.showTabMenu = Ext.Function.bind(this.showTabMenu,tab);
            tab.card.isTabMenuVisible = Ext.Function.bind(this.isTabMenuVisible,tab);
        }
    },
    
    hideTabMenu : function () {
        this.menuEl.hide();
    },
    
    showTabMenu : function () {
        this.menuEl.show();
    },

    isTabMenuVisible : function () {
        return this.menuEl.isVisible();
    }
});

// @source data/RateColumn.js

Ext.define('Ext.net.RatingColumn', {
    extend: 'Ext.grid.column.Column',
    alias: 'widget.ratingcolumn',
   
    dataIndex : "rating",    
    allowChange : true,
    selectedCls : "rating-selected",
    unselectedCls : "rating-unselected", 
    editable : false,
    maxRating : 5,    
    tickSize: 16, 
    roundToTick: true, 
    zeroSensitivity: 0.25, 

    constructor: function (config) {
        var me = this;        
        me.callParent(arguments);
        me.renderer = Ext.Function.bind(me.renderer, me);   
    },

    processEvent: function(type, view, cell, recordIndex, cellIndex, e) {
        if (this.editable && type == 'mousedown') {
            var grid = view.panel,
                record = grid.store.getAt(recordIndex);     
     
            if (this.allowChange || !record.isModified(this.dataIndex)) { 
                var value = (e.getXY()[0] - Ext.fly(e.getTarget()).getX()) / this.tickSize; 
                if (value < this.zeroSensitivity) { 
                    value = 0 
                } 
                if (this.roundToTick) { 
                    value = Math.ceil(value); 
                } 

                if(value > this.maxRating){
                    value = this.maxRating;
                }

                var ev = {
                    grid   : grid,
                    record : record,
                    field  : this.dataIndex,
                    value  : record.get(this.dataIndex),
                    row    : view.getNode(recordIndex),
                    column : this,
                    rowIdx : recordIndex,
                    colIdx : cellIndex,
                    cancel : false
                };

                if (grid.fireEvent("beforeedit", grid, ev) === false || ev.cancel === true) {
                    return;
                } 

                ev.originalValue = ev.value;
                ev.value = value;
            
                if (grid.fireEvent("validateedit", grid, ev) === false || ev.cancel === true) {
                    return;
                } 

                record.set(this.dataIndex, value); 

                grid.fireEvent('edit', grid, ev);
                // cancel selection.
                return false;
            }             
        } else {
            return this.callParent(arguments);
        }
    },   
    
    renderer: function(value, meta){
        meta.tdCls = "rating-cell";
        return Ext.String.format('<div class="{0}" style="width:{1}px;{4}"><div class="{2}" style="width:{3}px">&nbsp;</div></div>',
               this.unselectedCls,
               Math.round(this.tickSize * this.maxRating),
               this.selectedCls,
               Math.round(this.tickSize * value),
               this.editable ? "cursor:pointer;" : "");
   	}
});


Ext.define('Ext.ux.grid.TransformGrid', {
    extend : 'Ext.grid.Panel',
    alias  : "widget.transformgrid",

    constructor: function(config) {
        config = Ext.apply({}, config);
        var table;

        if (config.table.isComposite) {
            if (config.table.elements.length > 0) {
                table = Ext.get(config.table.elements[0]);
            }
        } else {
            table = Ext.get(config.table);
        }

        var configFields = config.fields || [],
            configColumns = config.columns || [],
            fields = [],
            cols = [],
            headers = table.query("thead th"),
            i = 0,
            len = headers.length,
            data = table.dom,
            width,
            height,
            store,
            col,
            text,
            name;

        for (; i < len; ++i) {
            col = headers[i];

            text = col.innerHTML;
            name = 'tcol-' + i;

            fields.push(Ext.applyIf(configFields[i] || {}, {
                name: name,
                mapping: 'td:nth(' + (i + 1) + ')/@innerHTML'
            }));

            cols.push(Ext.applyIf(configColumns[i] || {}, {
                text: text,
                dataIndex: name,
                width: col.offsetWidth,
                tooltip: col.title,
                sortable: true
            }));
        }

        if (config.width) {
            width = config.width;
        } else {
            width = table.getWidth() + 1;
        }

        if (config.height) {
            height = config.height;
        }

        Ext.apply(config, {
            store : {
                data   : data,
                fields : fields,
                proxy  : {
                    type : 'memory',
                    reader : {
                        record : 'tbody tr',
                        type   : 'xml'
                    }
                }
            },
            columns    : cols,
            width      : width,
            autoHeight : height ? false : true,
            height     : height
        });
        this.callParent([config]);

        Ext.defer(function () {
            this.render(data.parentNode, data);

            if (config.remove !== false) {
                // Don't use table.remove() as that destroys the row/cell data in the table in
                // IE6-7 so it cannot be read by the data reader.
                data.parentNode.removeChild(data);
            }
        }, 1, this);        
    },

    onDestroy : function () {
        this.callParent();
        this.table.remove();
        delete this.table;
    }
});



Ext.define('Ext.ux.SlidingPager', {
    requires: [
        'Ext.slider.Single',
        'Ext.slider.Tip'
    ],

    constructor : function(config) {
        if (config) {
            Ext.apply(this, config);
        }
    },

    init : function(pbar){
        var idx = pbar.items.indexOf(pbar.child("#inputItem")),
            slider;

        Ext.each(pbar.items.getRange(idx - 2, idx + 2), function(c){
            c.hide();
        });

        slider = Ext.create('Ext.slider.Single', {
            width: 114,
            minValue: 1,
            maxValue: 1,
            hideLabel: true,
            tipText: this.getTipText || function(thumb) {
                return Ext.String.format('Page <b>{0}</b> of <b>{1}</b>', thumb.value, thumb.slider.maxValue);
            },
            listeners: {
                changecomplete: function(s, v){
                    pbar.store.loadPage(v);
                }
            }
        });

        pbar.insert(idx + 1, slider);

        pbar.on({
            change: function(pb, data){
                slider.setMaxValue(data.pageCount);
                slider.setValue(data.currentPage);
            }
        });
    }
});




 Ext.define('Ext.ux.ToolbarDroppable', {
    extend: 'Ext.util.Observable',

    
    constructor: function(config) {
        Ext.apply(this, config);
        this.addEvents("beforeremotecreate", "remotecreate", "drop");
        this.callParent(arguments);       
    },

    
    init: function(toolbar) {
      
      this.toolbar = toolbar;

      this.toolbar.on({
          scope : this,
          render: this.createDropTarget
      });
    },

    
    createDropTarget: function() {
        
        this.dropTarget = Ext.create('Ext.dd.DropTarget', this.toolbar.getEl(), {
            notifyOver: Ext.Function.bind(this.notifyOver, this),
            notifyDrop: Ext.Function.bind(this.notifyDrop, this)
        });
    },

    
    addDDGroup: function(ddGroup) {
        this.dropTarget.addToGroup(ddGroup);
    },

        
    calculateEntryIndex: function(e) {
        var entryIndex = 0,
            toolbar = this.toolbar,
            items = toolbar.items.items,
            count = items.length,
            xHover = e.getXY()[0],
            index = 0,
            el, xTotal, width, midpoint;
 
        for (; index < count; index++) {
            el = items[index].getEl();
            xTotal = el.getXY()[0];
            width = el.getWidth();
            midpoint = xTotal + width / 2;
 
            if (xHover < midpoint) {
                entryIndex = index;

                break;
            } else {
                entryIndex = index + 1;
            }
        }

        return entryIndex;
    },

    
    canDrop: function(data) {
        return true;
    },

    
    notifyOver: function(dragSource, event, data) {
        return this.canDrop.apply(this, arguments) ? this.dropTarget.dropAllowed : this.dropTarget.dropNotAllowed;
    },

    
    notifyDrop: function(dragSource, event, data) {
        var canAdd = this.canDrop(dragSource, event, data),
            item,
            tbar   = this.toolbar;

        if (canAdd) {
            var entryIndex = this.calculateEntryIndex(event);

            if (this.remote) {
                var remoteOptions = {index : entryIndex},
                    dc = this.directEventConfig || {},
                    loadingItem;
                    
                if (this.fireEvent("beforeremotecreate", this, data, remoteOptions, dragSource, event) === false) {
                    return false;
                }
                
                loadingItem = new Ext.toolbar.TextItem({
                    text : "<div class='x-loading-indicator' style='width:16px;'>&nbsp;</div>"                    
                });
                tbar.insert(entryIndex, loadingItem); 
                
                dc.userSuccess = Ext.Function.bind(this.remoteCreateSuccess, this);
                dc.userFailure = Ext.Function.bind(this.remoteCreateFailure, this);
                dc.extraParams = remoteOptions;
                dc.control = this;
                dc.entryIndex = entryIndex;
                dc._data = data;
                dc.loadingItem = loadingItem;
                dc.eventType = "postback";
                dc.action = "create";
                
                Ext.net.DirectEvent.request(dc);
            }
            else {
                item = this.createItem(data);
                tbar.insert(entryIndex, item);    
                this.fireEvent("drop", this, item, entryIndex, data);            
            }
            tbar.doLayout();

            this.afterLayout();
        }

        return canAdd;
    },

    remoteCreateSuccess : function (response, result, context, type, action, extraParams, o) {
        this.toolbar.remove(o.loadingItem);
        
        var rParams,
            entryIndex,
            item;
		
		try {
			rParams = result.extraParamsResponse || {};
			var responseObj = result.serviceResponse;
            result = { success: responseObj.success, msg: responseObj.message };            
		} catch (ex) {
		    result.success = false;
		    result.msg = ex.message;
		}
		
        this.fireEvent("remotecreate", this, !!result.success, result.msg, response, o);
		
		entryIndex = Ext.isDefined(rParams.ra_index) ? rParams.ra_index : o.entryIndex;
        item = Ext.decode(rParams.ra_item);
        this.toolbar.insert(entryIndex, item); 
        this.fireEvent("drop", this, item, entryIndex, o._data);
		
		this.toolbar.doLayout();
        this.afterLayout();
    },
    
    remoteCreateFailure : function (response, result, context, type, action, extraParams, o) {
        this.toolbar.remove(o.loadingItem);
        this.fireEvent("remotecreate", this, false, response.responseText, response, o);
        
	    this.toolbar.doLayout();	
        this.afterLayout();
    },

    
    createItem: function(data) {
        //<debug>
        Ext.Error.raise("The createItem method must be implemented in the ToolbarDroppable plugin");
        //</debug>
    },

    
    afterLayout: Ext.emptyFn,

    // Fix for github issue #258. Remove after Sehcna fix
    destroy: function () {
        if (this.dropTarget) {
            this.dropTarget.destroy();
        }
    }
});



Ext.define('Ext.ux.BoxReorderer', {
    mixins: {
        observable: 'Ext.util.Observable'
    },

    
    boxItemSelector: '.x-box-item',

    
    animate: 100,

    constructor: function() {
        this.addEvents(
            
             'StartDrag',
            
             'Drag',
            
             'ChangeIndex',
            
             'Drop'
        );
        this.mixins.observable.constructor.apply(this, arguments);
    },

    init : function (container) {
        var me = this;
 
        me.container = container;
 
        // Set our animatePolicy to animate the start position (ie x for HBox, y for VBox)
        me.animatePolicy = {};
        me.animatePolicy[container.getLayout().names.x] = true;

        // Initialize the DD on first layout, when the innerCt has been created.
        me.container.on({
            scope: me,
            boxready: me.afterFirstLayout,
            beforedestroy: me.onContainerDestroy
        });
    },

    
    onContainerDestroy: function() {
        var dd = this.dd;
        if (dd) {
            dd.unreg();
            this.dd = null;
        }
    },

    afterFirstLayout: function() {
        var me = this,
            layout = me.container.getLayout(),
            names = layout.names,
            dd;

        // Create a DD instance. Poke the handlers in.
        // TODO: Ext5's DD classes should apply config to themselves.
        // TODO: Ext5's DD classes should not use init internally because it collides with use as a plugin
        // TODO: Ext5's DD classes should be Observable.
        // TODO: When all the above are trus, this plugin should extend the DD class.
        dd = me.dd = Ext.create('Ext.dd.DD', layout.innerCt, me.container.id + '-reorderer');
        Ext.apply(dd, {
            animate: me.animate,
            reorderer: me,
            container: me.container,
            getDragCmp: this.getDragCmp,
            clickValidator: Ext.Function.createInterceptor(dd.clickValidator, me.clickValidator, me, false),
            onMouseDown: me.onMouseDown,
            startDrag: me.startDrag,
            onDrag: me.onDrag,
            endDrag: me.endDrag,
            getNewIndex: me.getNewIndex,
            doSwap: me.doSwap,
            findReorderable: me.findReorderable
        });

        // Decide which dimension we are measuring, and which measurement metric defines
        // the *start* of the box depending upon orientation.
        dd.dim = names.width;
        dd.startAttr = names.beforeX;
        dd.endAttr = names.afterX;
    },

    getDragCmp: function(e) {
        return this.container.getChildByElement(e.getTarget(this.itemSelector || this.boxItemSelector, 10));
    },

    // check if the clicked component is reorderable
    clickValidator: function(e) {
        var cmp = this.getDragCmp(e);

        // If cmp is null, this expression MUST be coerced to boolean so that createInterceptor is able to test it against false
        return !!(cmp && cmp.reorderable !== false);
    },

    onMouseDown: function(e) {
        var me = this,
            container = me.container,
            containerBox,
            cmpEl,
            cmpBox;

        // Ascertain which child Component is being mousedowned
        me.dragCmp = me.getDragCmp(e);
        if (me.dragCmp) {
            cmpEl = me.dragCmp.getEl();
            me.startIndex = me.curIndex = container.items.indexOf(me.dragCmp);

            // Start position of dragged Component
            cmpBox = cmpEl.getBox();

            // Last tracked start position
            me.lastPos = cmpBox[this.startAttr];

            // Calculate constraints depending upon orientation
            // Calculate offset from mouse to dragEl position
            containerBox = container.el.getBox();
            if (me.dim === 'width') {
                me.minX = containerBox.left;
                me.maxX = containerBox.right - cmpBox.width;
                me.minY = me.maxY = cmpBox.top;
                me.deltaX = e.getPageX() - cmpBox.left;
            } else {
                me.minY = containerBox.top;
                me.maxY = containerBox.bottom - cmpBox.height;
                me.minX = me.maxX = cmpBox.left;
                me.deltaY = e.getPageY() - cmpBox.top;
            }
            me.constrainY = me.constrainX = true;
        }
    },

    startDrag: function() {
        var me = this,
            dragCmp = me.dragCmp;
            
        if (dragCmp) {
            // For the entire duration of dragging the *Element*, defeat any positioning and animation of the dragged *Component*
            dragCmp.setPosition = Ext.emptyFn;
            dragCmp.animate = false;

            // Animate the BoxLayout just for the duration of the drag operation.
            if (me.animate) {
                me.container.getLayout().animatePolicy = me.reorderer.animatePolicy;
            }
            // We drag the Component element
            me.dragElId = dragCmp.getEl().id;
            me.reorderer.fireEvent('StartDrag', me, me.container, dragCmp, me.curIndex);
            // Suspend events, and set the disabled flag so that the mousedown and mouseup events
            // that are going to take place do not cause any other UI interaction.
            dragCmp.suspendEvents();
            dragCmp.disabled = true;
            dragCmp.el.setStyle('zIndex', 100);
        } else {
            me.dragElId = null;
        }
    },

    
    findReorderable : function (newIndex) {
        var me = this,
            items = me.container.items,
            newItem;

        if (items.getAt(newIndex).reorderable === false) {
            newItem = items.getAt(newIndex);
            if (newIndex > me.startIndex) {
                 while(newItem && newItem.reorderable === false) {
                    newIndex++;
                    newItem = items.getAt(newIndex);
                }
            } else {
                while(newItem && newItem.reorderable === false) {
                    newIndex--;
                    newItem = items.getAt(newIndex);
                }
            }
        }

        newIndex = Math.min(Math.max(newIndex, 0), items.getCount() - 1);

        if (items.getAt(newIndex).reorderable === false) {
            return -1;
        }
        return newIndex;
    },

    
    doSwap : function (newIndex) {
        var me = this,
            items = me.container.items,
            container = me.container,
            wasRoot = me.container._isLayoutRoot,
            orig, dest, tmpIndex, temp;

        newIndex = me.findReorderable(newIndex);

        if (newIndex === -1) {
            return;
        }

        me.reorderer.fireEvent('ChangeIndex', me, container, me.dragCmp, me.startIndex, newIndex);
        orig = items.getAt(me.curIndex);
        dest = items.getAt(newIndex);
        items.remove(orig);
        tmpIndex = Math.min(Math.max(newIndex, 0), items.getCount() - 1);
        items.insert(tmpIndex, orig);
        items.remove(dest);
        items.insert(me.curIndex, dest);

        // Make the Box Container the topmost layout participant during the layout.
        container._isLayoutRoot = true;
        container.updateLayout();
        container._isLayoutRoot = wasRoot;
        me.curIndex = newIndex;
    },

    onDrag : function (e) {
        var me = this,
            newIndex;

        newIndex = me.getNewIndex(e.getPoint());
        if ((newIndex !== undefined)) {
            me.reorderer.fireEvent('Drag', me, me.container, me.dragCmp, me.startIndex, me.curIndex);
            me.doSwap(newIndex);
        }

    },

    endDrag: function(e) {
        if (e) {
            e.stopEvent();
        }
        var me = this,
            layout = me.container.getLayout(),
            temp;

        if (me.dragCmp) {
            delete me.dragElId;

            // Reinstate the Component's positioning method after mouseup, and allow the layout system to animate it.
            delete me.dragCmp.setPosition;
            me.dragCmp.animate = true;
            
            // Ensure the lastBox is correct for the animation system to restore to when it creates the "from" animation frame
            me.dragCmp.lastBox[layout.names.x] = me.dragCmp.getPosition(true)[layout.names.widthIndex];

            // Make the Box Container the topmost layout participant during the layout.
            me.container._isLayoutRoot = true;
            me.container.updateLayout();
            me.container._isLayoutRoot = undefined;
            
            // Attempt to hook into the afteranimate event of the drag Component to call the cleanup
            temp = Ext.fx.Manager.getFxQueue(me.dragCmp.el.id)[0];
            if (temp) {
                temp.on({
                    afteranimate : me.reorderer.afterBoxReflow,
                    scope        : me
                });
            } 
            // If not animated, clean up after the mouseup has happened so that we don't click the thing being dragged
            else {
                Ext.Function.defer(me.reorderer.afterBoxReflow, 1, me);
            }

            if (me.animate) {
                delete layout.animatePolicy;
            }

            me.reorderer.fireEvent('drop', me, me.container, me.dragCmp, me.startIndex, me.curIndex);
        }
    },

    
    afterBoxReflow : function () {
        var me = this;
        me.dragCmp.el.setStyle('zIndex', '');
        me.dragCmp.disabled = false;
        me.dragCmp.resumeEvents();
    },

    
    getNewIndex : function (pointerPos) {
        var me = this,
            dragEl = me.getDragEl(),
            dragBox = Ext.fly(dragEl).getBox(),
            targetEl,
            targetBox,
            targetMidpoint,
            i = 0,
            it = me.container.items.items,
            ln = it.length,
            lastPos = me.lastPos;

        me.lastPos = dragBox[me.startAttr];

        for (; i < ln; i++) {
            targetEl = it[i].getEl();

            // Only look for a drop point if this found item is an item according to our selector
            if (targetEl.is(me.reorderer.boxItemSelector)) {
                targetBox = targetEl.getBox();
                targetMidpoint = targetBox[me.startAttr] + (targetBox[me.dim] >> 1);
                if (i < me.curIndex) {
                    if ((dragBox[me.startAttr] < lastPos) && (dragBox[me.startAttr] < (targetMidpoint - 5))) {
                        return i;
                    }
                } else if (i > me.curIndex) {
                    if ((dragBox[me.startAttr] > lastPos) && (dragBox[me.endAttr] > (targetMidpoint + 5))) {
                        return i;
                    }
                }
            }
        }
    }
});

Ext.ux.BoxReorderer.override(Ext.util.DirectObservable);

Ext.define('Ext.ux.TabReorderer', {

    extend : 'Ext.ux.BoxReorderer',

    boxItemSelector : '.x-tab',

    init : function(tabPanel) {
        var me = this;
        
        me.isTabStrip = !tabPanel.getTabBar;
        me.callParent([!me.isTabStrip ? tabPanel.getTabBar() : tabPanel]);

        // Ensure reorderable property is copied into dynamically added tabs
        if(!me.isTabStrip) {
            tabPanel.onAdd = Ext.Function.createSequence(tabPanel.onAdd, me.onAdd);
        }
    },

    afterFirstLayout : function () {
        var tabs,
            me = this,
            len,
            i = 0,
            tab;

        this.callParent(arguments);

        // Copy reorderable property from card into tab
        if(!me.isTabStrip) {
            for (tabs = me.container.items.items, len = tabs.length; i < len; i++) {
                tab = tabs[i];
                if (tab.card) {
                    tab.reorderable = tab.card.reorderable;
                }
            }
        }
    },

    onAdd : function (card, index) {
        card.tab.reorderable = card.reorderable;
    },

    afterBoxReflow : function() {
        var me = this;

        // Cannot use callParent, this is not called in the scope of this plugin, but that of its Ext.dd.DD object
        Ext.ux.BoxReorderer.prototype.afterBoxReflow.apply(me, arguments);

        // Move the associated card to match the tab order
        if (me.dragCmp) {
            if (!me.container.tabPanel) {
                me.container.setActiveTab(me.dragCmp);
                //me.container.move(me.startIndex, me.curIndex);
            }
            else {
                me.container.tabPanel.setActiveTab(me.dragCmp.card);
                me.container.tabPanel.move(me.startIndex, me.curIndex);
            }
        }
    }
});
Ext.define('Ext.ux.SelectBox', {
    extend : "Ext.form.ComboBox",
    alias : "widget.selectbox",
	constructor: function (config) {
        this.searchResetDelay = 1000;
  
        config = config || {};
          
        config = Ext.apply(config || {}, {
            editable: false,
            forceSelection: true,
            rowHeight: false,
            lastSearchTerm: false,
            triggerAction: "all",
            queryMode: "local"
        });
  
        Ext.ux.SelectBox.superclass.constructor.call(this, config);
  
        this.lastSelectedIndex = this.selectedIndex || 0;
  
        this.on("select", function (combo, records) {
            this.lastSelectedIndex = this.getStore().indexOf(records[0]) + 1;
        });
    },

	initEvents : function () {
		this.callParent(arguments);
		// you need to use keypress to capture upper/lower case and shift+key, but it doesn"t work in IE
		this.inputEl.on("keypress", this.keySearch, this, true);
		this.cshTask = new Ext.util.DelayedTask(this.clearSearchHistory, this);
	},

	keySearch : function (e, target, options) {
        var raw = e.getKey();
        var key = String.fromCharCode(raw);
        var startIndex = 0;
 
        if (!this.store.getCount()) {
            return;
        }
 
        switch(raw) {
            case Ext.EventObject.HOME:
                e.stopEvent();
                this.selectFirst();
                return;
 
            case Ext.EventObject.END:
                e.stopEvent();
                this.selectLast();
                return;
 
            case Ext.EventObject.PAGEDOWN:
                this.selectNextPage();
                e.stopEvent();
                return;
 
            case Ext.EventObject.PAGEUP:
                this.selectPrevPage();
                e.stopEvent();
                return;
        }
 
        // skip special keys other than the shift key
        if ( (e.hasModifier() && !e.shiftKey) || e.isNavKeyPress() || e.isSpecialKey() ) {
            return;
        }
        if ( this.lastSearchTerm == key ) {
            startIndex = this.lastSelectedIndex;
        }
        this.search(this.displayField, key.toLocaleLowerCase ? key.toLocaleLowerCase() : key.toLowerCase() , startIndex);
        this.cshTask.delay(this.searchResetDelay);

        e.preventDefault();
        return false;
    },

	onRender : function (ct, position) {		
		this.callParent(arguments);
        this.createPicker();
		this.picker.on("refresh", this.calcRowsPerPage, this);
	},

	afterRender : function () {
		this.callParent(arguments);
		if (Ext.isWebKit) {
			this.inputEl.swallowEvent("mousedown", true);
		}
		this.inputEl.unselectable();		
        if(this.picker.rendered){
            this.picker.listEl.unselectable();		
        }
        else{
            this.picker.on("render", function(){
                this.picker.listEl.unselectable();		
            }, this);
        }

		this.picker.on("itemmouseenter", function (view, record, node, index) {
			this.lastSelectedIndex = index + 1;
			this.cshTask.delay(this.searchResetDelay);
		}, this);		
	},

	clearSearchHistory : function () {
		this.lastSelectedIndex = 0;
		this.lastSearchTerm = false;
	},

	selectFirst : function () {
		this.focusAndSelect(this.store.data.first());
	},

	selectLast : function () {
		this.focusAndSelect(this.store.data.last());
	},

	selectPrevPage : function () {
		if ( !this.rowHeight ) {
			return;
		}
		var index = Math.max(this.selectedIndex-this.rowsPerPage, 0);
		this.focusAndSelect(this.store.getAt(index));
	},

	selectNextPage : function () {
		if ( !this.rowHeight ) {
			return;
		}
		var index = Math.min(this.selectedIndex+this.rowsPerPage, this.store.getCount() - 1);
		this.focusAndSelect(this.store.getAt(index));
	},

	search : function (field, value, startIndex) {
		field = field || this.displayField;
		this.lastSearchTerm = value;
		var index = this.store.find.apply(this.store, arguments);
		if ( index !== -1 ) {
			this.focusAndSelect(index);
		}
	},

	focusAndSelect : function (record) {
        var picker = this.getPicker();
 
        record = Ext.isNumber(record) ? this.store.getAt(record) : record;
        this.ignoreSelection++;
        picker.clearHighlight();
        picker.select(record);
        this.ignoreSelection--;
 
        if (picker.listEl) {
            picker.listEl.scrollChildIntoView(this.picker.getNode(record), false);
        }
  
        this.setValue([record], false);
        this.fireEvent('select', this, [record]);
        this.inputEl.focus();
    },

	calcRowsPerPage : function () {
		if ( this.store.getCount() ) {
			this.rowHeight = Ext.fly(this.picker.getNode(0)).getHeight();
			this.rowsPerPage = this.maxHeight / this.rowHeight;
		} else {
			this.rowHeight = false;
		}
	}
});




Ext.define('Ext.ux.desktop.Module', {
    mixins: {
        observable: 'Ext.util.Observable'
    },

    constructor: function (config) {
        this.mixins.observable.constructor.call(this, config);
        this.init();
    },    

    init: Ext.emptyFn,
    
    createWindow : function (config) {
        if(!this.window){
            return;
        }
        
        var desktop = this.app.getDesktop(),
            win = desktop.getModuleWindow(this.id),     
            wndCfg,       
            isReopen = !win && this.win;        

        win = win || this.win;

        if(!win){            
            wndCfg = this.window.call(window) || this._window;

            if (this.remoteResources) {
                this.waitResources = true;
                return;
            }
            
            if(config){
                wndCfg = Ext.apply(wndCfg, config);
            }
            
            win = desktop.createWindow(wndCfg);
            win.moduleId = this.id;
            if(win.closeAction === "hide"){
                this.win = win;
                win.on("destroy", function () {
                    delete this.win;
                }, this);
            }
        }

        if(isReopen){
            desktop.windows.add(win);

            win.taskButton = desktop.taskbar.addTaskButton(win);
            win.animateTarget = win.taskButton.el;
        }        
        win.show();
        return win;
    },

    addWindow: function (window, remoteResources) {
        this.window = window;
        this.remoteResources = remoteResources;
        if(this.autoRun && !this.autoRunHandler){
            this.createWindow();
        }
    },

    setWindow : function (window) {
        this._window = window;
        if (this.remoteResources) {
            delete this.remoteResources;

            if (this.waitResources) {
                delete this.waitResources;
                this.createWindow();
            }
        }
    },

    addLauncher : function (launcher) {
        this.launcher = launcher;

        if(!(this.launcher.handler || this.launcher.listeners && this.launcher.listeners.click)){
            this.launcher.handler = function() {
                this.createWindow();
            };
            this.launcher.scope = this;                
        }
        this.launcher.moduleId = this.id;
        this.app.desktop.taskbar.startMenu.menu.add(this.launcher);
    },

    run : function () {
        return this.createWindow();
    }
    
});




Ext.define('Ext.ux.desktop.ShortcutModel', {
    extend: 'Ext.data.Model',
    idProperty: "module",
    fields: [
       { name: 'name' },
       { name: 'iconCls' },
       { name: 'module' },
       { name: 'qtitle' },
       { name: 'qtip' },
       { name: 'x' },
       { name: 'y' },
       { name: 'sortIndex', type:"int" },
       { name: 'tempX', type: "int", useNull: true },
       { name: 'tempY', type: "int", useNull: true },
       { name: 'handler' },
       { name: 'textCls', defaultValue:"" },
       { name: 'hidden', type: "boolean" }
    ]
});




Ext.define('Ext.ux.desktop.Wallpaper', {
    extend: 'Ext.Component',

    alias: 'widget.wallpaper',
    style: "position:absolute;",

    cls: 'ux-wallpaper',
    html: '<img src="'+Ext.BLANK_IMAGE_URL+'">',

    stretch: false,
    wallpaper: null,

    afterRender: function () {
        var me = this;
        me.callParent();
        me.setWallpaper(me.wallpaper, me.stretch);
    },

    applyState: function () {
        var me = this, old = me.wallpaper;
        me.callParent(arguments);
        if (old != me.wallpaper) {
            me.setWallpaper(me.wallpaper);
        }
    },

    getState: function () {
        return this.wallpaper && { wallpaper: this.wallpaper };
    },

    setWallpaper: function (wallpaper, stretch) {
        var me = this, imgEl, bkgnd;

        me.stretch = (stretch === true);
        me.wallpaper = wallpaper;

        if (me.rendered) {
            imgEl = me.el.dom.firstChild;

            if (!wallpaper || wallpaper == Ext.BLANK_IMAGE_URL) {
                Ext.fly(imgEl).hide();
            } else if (me.stretch) {
                imgEl.src = wallpaper;

                me.el.removeCls('ux-wallpaper-tiled');
                Ext.fly(imgEl).setStyle({
                    width: '100%',
                    height: '100%'
                }).show();
            } else {
                Ext.fly(imgEl).hide();

                bkgnd = 'url('+wallpaper+')';
                me.el.addCls('ux-wallpaper-tiled');
            }

            me.el.setStyle({
                backgroundImage: bkgnd || ''
            });
        }
        return me;
    }
});



Ext.define('Ext.ux.desktop.StartMenu', {
    extend: 'Ext.panel.Panel',

    requires: [
        'Ext.menu.Menu',
        'Ext.toolbar.Toolbar'
    ],

    ariaRole: 'menu',

    cls: 'x-menu ux-start-menu',

    defaultAlign: 'bl-tl',

    iconCls: 'user',

    floating: true,

    shadow: true,

    hideTools : false,

    // We have to hardcode a width because the internal Menu cannot drive our width.
    // This is combined with changing the align property of the menu's layout from the
    // typical 'stretchmax' to 'stretch' which allows the the items to fill the menu
    // area.
    width: 300,

    initComponent: function() {
        var me = this, menu = me.menu;

        me.menu = new Ext.menu.Menu({
            cls: 'ux-start-menu-body',
            border: false,
            floating: false,
            items: menu
        });
        me.menu.layout.align = 'stretch';

        me.items = [me.menu];
        me.layout = 'fit';

        Ext.menu.Manager.register(me);
        me.callParent();
        // TODO - relay menu events

        me.toolbar = new Ext.toolbar.Toolbar(Ext.apply({
            dock: 'right',
            cls: 'ux-start-menu-toolbar',
            vertical: true,
            width: 100,
            hidden : me.hideTools,
            listeners: {
                add: function(tb, c) {
                    c.on({
                        click: function() {
                            me.hide();
                        }
                    });
                }
            }
        }, me.toolConfig));

        me.toolbar.layout.align = 'stretch';
        me.addDocked(me.toolbar);

        delete me.toolItems;
    },

    addMenuItem: function() {
        var cmp = this.menu;
        cmp.add.apply(cmp, arguments);
    },

    addToolItem: function() {
        var cmp = this.toolbar;
        cmp.add.apply(cmp, arguments);
    }
}); // StartMenu




Ext.define('Ext.ux.desktop.TaskBar', {
    extend: 'Ext.toolbar.Toolbar', // TODO - make this a basic hbox panel...

    requires: [
        'Ext.button.Button',
        'Ext.resizer.Splitter',
        'Ext.menu.Menu',

        'Ext.ux.desktop.StartMenu'
    ],

    alias: 'widget.taskbar',

    cls: 'ux-taskbar',

    
    startBtnText: 'Start',
    startBtnIconCls: 'ux-start-button-icon',
    standOut : false,
    dock: "bottom",
    quickStartWidth : 60,
    trayWidth : 80,
    trayClockConfig : true,
    height: 27,

    initComponent: function () {
        var me = this;

        me.startMenu = new Ext.ux.desktop.StartMenu(me.startConfig);

        me.quickStart = new Ext.toolbar.Toolbar(me.getQuickStart());
        me.quickStart.on("resize", function(){
            this.desktop.saveState();
        }, this, {buffer:100});

        me.windowBar = new Ext.toolbar.Toolbar(me.getWindowBarConfig());

        me.tray = new Ext.toolbar.Toolbar(me.getTrayConfig());
        me.tray.on("resize", function(){
            this.desktop.saveState();
        }, this, {buffer:100});

        me.items = [
            {
                xtype: 'button',
                cls: 'ux-start-button',
                iconCls: me.startBtnIconCls,
                menu: me.startMenu,
                //menuAlign: 'bl-tl',
                text: me.startBtnText
            },
            '-',
            me.quickStart,
            {
                xtype: 'splitter', html: '&#160;',
                hidden: me.hideQuickStart,
                height: 14, width: 4, // TODO - there should be a CSS way here
                style:"cursor:e-resize;",
                cls: 'x-toolbar-separator x-toolbar-separator-horizontal',
                listeners: {
                    "afterrender": function(){
                        this.tracker.onDrag = Ext.Function.createSequence(this.tracker.onDrag, this.tracker.performResize, this.tracker);
                    }
                }
            },
            //'-',
            me.windowBar,
            {
                xtype: 'splitter', html: '&#160;',
                hidden: me.hideTray,
                height: 14, width: 4, // TODO - there should be a CSS way here
                style:"cursor:w-resize;",
                cls: 'x-toolbar-separator x-toolbar-separator-horizontal',
                listeners: {
                    "afterrender": function(){
                        this.tracker.onDrag = Ext.Function.createSequence(this.tracker.onDrag, this.tracker.performResize, this.tracker);
                    }
                }
            },
            me.tray
        ];

        me.callParent();
    },

    afterLayout: function () {
        var me = this;
        me.callParent();
        me.windowBar.el.on('contextmenu', me.onButtonContextMenu, me);
    },

    
    getQuickStart: function () {
        var ret = Ext.apply({
            minWidth: 20,
            enableOverflow: true,
            width: this.quickStartWidth,         
            hidden: this.hideQuickStart   
        }, this.quickStartConfig);
        delete this.quickStartConfig;
        return ret;
    },

    
    getTrayConfig: function () {
        var ret = Ext.apply({
            width: this.trayWidth,         
            hidden: this.hideTray,
            items: []   
        }, this.trayConfig);
        delete this.trayConfig;

        if(this.trayClock){
            ret.items.push(Ext.isObject(this.trayClock) ? this.trayClock : { xtype: 'trayclock', flex: 1 });
        }

        return ret;
    },

    getWindowBarConfig: function () {
        return {
            flex: 1,
            cls: 'ux-desktop-windowbar',
            //items: [ '&#160;' ],
            layout: { overflowHandler: 'Scroller' }
        };
    },

    getWindowBtnFromEl: function (el) {
        var c = this.windowBar.getChildByElement(el);
        return c || null;
    },

    onButtonContextMenu: function (e) {
        var me = this, t = e.getTarget(), btn = me.getWindowBtnFromEl(t);
        if (btn) {
            e.stopEvent();
            me.windowMenu.theWin = btn.win;
            me.windowMenu.showBy(t);
        }
    },

    onWindowBtnClick: function (btn) {
        var win = btn.win;

        if (win.minimized || win.hidden) {
            btn.disable();
            win.show(null, function() {
                btn.enable();
            });
        } else if (win.active) {
            btn.disable();
            win.on('hide', function() {
                btn.enable();
            }, null, {single: true});
            win.minimize();
        } else {
            win.toFront();
        }
    },

    addTaskButton: function(win) {
        var config = {
            iconCls: win.iconCls,
            standOut : this.standOut,
            enableToggle: true,
            toggleGroup: 'all',
            width: 140,
            margins: '0 2 0 3',
            text: Ext.util.Format.ellipsis(win.title, 20),
            listeners: {
                click: this.onWindowBtnClick,
                scope: this
            },
            win: win
        };

        var cmp = this.windowBar.add(config);
        cmp.toggle(true);
        return cmp;
    },

    removeTaskButton: function (btn) {
        var found, me = this;
        me.windowBar.items.each(function (item) {
            if (item === btn) {
                found = item;
            }
            return !found;
        });
        if (found) {
            me.windowBar.remove(found);
        }
        return found;
    },

    setActiveButton: function(btn) {
        if (btn) {
            btn.toggle(true);
        } else {
            this.windowBar.items.each(function (item) {
                if (item.isButton) {
                    item.toggle(false);
                }
            });
        }
    }
});


Ext.define('Ext.ux.desktop.TrayClock', {
    extend: 'Ext.toolbar.TextItem',

    alias: 'widget.trayclock',

    cls: 'ux-desktop-trayclock',

    html: '&#160;',

    timeFormat: 'g:i A',

    tpl: '{time}',
    refreshInterval : 10000,

    initComponent: function () {
        var me = this;

        me.callParent();

        if (typeof(me.tpl) == 'string') {
            me.tpl = new Ext.XTemplate(me.tpl);
        }
    },

    afterRender: function () {
        var me = this;
        Ext.Function.defer(me.updateTime, 100, me);
        me.callParent();
    },

    onDestroy: function () {
        var me = this;

        if (me.timer) {
            window.clearTimeout(me.timer);
            me.timer = null;
        }

        me.callParent();
    },

    updateTime: function () {
        var me = this, time = Ext.Date.format(new Date(), me.timeFormat),
            text = me.tpl.apply({ time: time });
        if (me.lastText != text) {
            me.setText(text);
            me.lastText = text;
        }
        me.timer = Ext.Function.defer(me.updateTime, me.refreshInterval, me);
    }
});




Ext.define('Ext.ux.desktop.Desktop', {
    extend: 'Ext.panel.Panel',

    alias: 'widget.desktop',

    uses: [
        'Ext.util.MixedCollection',
        'Ext.menu.Menu',
        'Ext.view.View', // dataview
        'Ext.window.Window',

        'Ext.ux.desktop.TaskBar',
        'Ext.ux.desktop.Wallpaper'
    ],

    activeWindowCls: 'ux-desktop-active-win',
    inactiveWindowCls: 'ux-desktop-inactive-win',
    lastActiveWindow: null,

    border: false,
    html: '&#160;',
    layout: 'fit',

    xTickSize: 1,
    yTickSize: 1,

    app: null,

    
    shortcuts: null,

    
    shortcutItemSelector: 'div.ux-desktop-shortcut',

    shortcutEvent: "click",
    ddShortcut : true,
    shortcutDragSelector: true,
    shortcutNameEditing : false,
    alignToGrid : true,
    multiSelect : true,
    defaultWindowMenu : true,
    restoreText : 'Restore',
    minimizeText : 'Minimize',
    maximizeText : 'Maximize',
    closeText : 'Close',
    defaultWindowMenuItemsFirst : false,


    getState : function () {
        var shortcuts = [];
        
        this.shortcuts.each(function(record){
            var x = record.data.x,
                y = record.data.y;

            if(!Ext.isEmpty(x) || !Ext.isEmpty(y)){
                shortcuts.push({x:x,y:y, m:record.data.module});
            }
        });

        return {s:shortcuts, q:this.taskbar.quickStart.getWidth(), t:this.taskbar.tray.getWidth()}; 
    },

    applyState : function (state) {
        if(this.shortcuts && state.s){
            Ext.each(state.s, function(coord){
                this.shortcuts.each(function(shortcut){
                    if(shortcut.data.module == coord.m){
                        shortcut.data.x = coord.x;
                        shortcut.data.y = coord.y;
                        return false;
                    }
                }, this);
            }, this);
        }

        if(this.taskbar.quickStart && state.q){
            this.taskbar.quickStart.setWidth(state.q);
        }

        if(this.taskbar.tray && state.t){
            this.taskbar.tray.setWidth(state.t);
        }
    },

    
    shortcutTpl: [
        '<tpl for=".">',
            '<div class="ux-desktop-shortcut" style="{[this.getPos(values)]}">',
                '<div class="ux-desktop-shortcut-wrap">',
                '<div class="ux-desktop-shortcut-icon {iconCls}">',
                    '<img src="',Ext.BLANK_IMAGE_URL,'" title="{name}">',
                '</div>',
                '<div class="ux-desktop-shortcut-text {textCls}">{name}</div>',
                '</div>',
                '<div class="ux-desktop-shortcut-bg"></div>',
            '</div>',
        '</tpl>',
        '<div class="x-clear"></div>'
    ],

    
    taskbarConfig: null,

    windowMenu: null,

    initComponent: function () {
        var me = this;

        me.windowMenu = me.createWindowMenu();

        me.taskbar = new Ext.ux.desktop.TaskBar(me.taskbarConfig);
        this.dockedItems = this.dockedItems || [];
        this.dockedItems.push(me.taskbar);

        me.taskbar.windowMenu = me.windowMenu;
        me.taskbar.desktop = this;

        me.windows = new Ext.util.MixedCollection();

        if(me.contextMenu){
            me.contextMenu = Ext.ComponentManager.create(me.contextMenu, "menu");
        }

        if(me.shortcutContextMenu){
            me.shortcutContextMenu = Ext.ComponentManager.create(me.shortcutContextMenu, "menu");
        }

        var uItems = me.items;

        me.items = [
            { xtype: 'wallpaper', id: me.id+'_wallpaper', desktop: this },
            me.createDataView()
        ];

        if(Ext.isArray(uItems) && uItems.length>0){
            me.items = me.items.concat(uItems);
        }

        me.callParent();

        me.shortcutsView = me.items.getAt(1);
        me.shortcutsView.on('item'+me.shortcutEvent, me.onShortcutItemClick, me);

        var wallpaper = me.wallpaper;
        me.wallpaper = me.items.getAt(0);
        if (wallpaper) {
            me.setWallpaper(wallpaper, me.wallpaperStretch);            
        }
    },

    afterRender: function () {
        var me = this;
        me.callParent();
        me.el.on('contextmenu', me.onDesktopMenu, me);   
        me.wallpaper.on("resize", function(){
            me.getComponent(1).setSize(me.wallpaper.getSize());
        }, me);
        me.getComponent(1).setSize(me.wallpaper.getSize());

        me.tip = Ext.create("Ext.tip.ToolTip",{         
            delegate:".ux-desktop-shortcut",
            target:me.getComponent(1).el,
            trackMouse:true,
            listeners:{
                beforeshow:{
                    fn:this.showTip,
                    scope: this
                }
            }
        });        
    },

    showTip : function () {
        var view = this.getComponent(1),
            record = view.getRecord(this.tip.triggerElement);

        if(!record || Ext.isEmpty(record.get('qTip'))){
            this.tip.addCls("x-hide-visibility");
            return;
        }

        this.tip.removeCls("x-hide-visibility");

        if(!Ext.isEmpty(record.get('qTitle'))){
            this.tip.setTitle(record.get('qTitle'));
            this.tip.header.removeCls("x-hide-display");
        }
        else if(this.tip.header){
            this.tip.header.addCls("x-hide-display");
        }
        this.tip.update(record.get('qTip'));
    },

    //------------------------------------------------------
    // Overrideable configuration creation methods

    createDataView: function () {
        var me = this,            
            data;
        
        if(!me.shortcuts){
            data = [];

            Ext.each(this.app.modules, function (module) {
                var s = module.shortcut;
                if(module.shortcut && module.shortcut.hidden !== true){
                    if(me.shortcutDefaults){
                        Ext.applyIf(s, me.shortcutDefaults);
                    }

                    data.push(s);
                }
            }, me);
            
            me.shortcuts = Ext.create('Ext.data.Store', {
                model: 'Ext.ux.desktop.ShortcutModel',
                data: data,
                listeners: {
                    "add" : {
                        fn: this.addShortcutsDD,
                        delay:100,
                        scope: this
                     },
                    "remove" : {
                        fn: this.removeShortcutsDD,
                        scope: this
                    }
                }
            });

            if(this.sortShortcuts !== false){
                me.shortcuts.sort("sortIndex", "ASC");
            }

            me.shortcuts.on("datachanged", me.saveState, me, {buffer:100});
        }

        Ext.EventManager.onWindowResize(this.onWindowResize, this, { buffer: 100 });

        var plugins = [],
            tpl;

        if(this.shortcutDragSelector && this.multiSelect !== false){
            plugins.push(Ext.create('Ext.ux.DataView.DragSelector', {}));
        }

        if(this.shortcutNameEditing){
            this.labelEditor = Ext.create('Ext.ux.DataView.LabelEditor', {
                dataIndex : "name",
                autoSize: false,
                offsets:[-6,0],
                field : Ext.create('Ext.form.field.TextArea', {
                    allowBlank: false,
                    width:66,
                    growMin:20,
                    enableKeyEvents:true,
                    style:"overflow:hidden",
                    grow:true,
                    selectOnFocus:true,
                    listeners : {
                        keydown: function (field, e) {
                            if (e.getKey() == e.ENTER) {
                                this.labelEditor.completeEdit();
                            }
                        },
                        scope: this
                    }
                }),
                labelSelector : "ux-desktop-shortcut-text"
            });
            this.labelEditor.on("complete", function(editor, value, oldValue){
                this.app.fireEvent("shortcutnameedit", this.app, this.app.getModule(editor.activeRecord.data.module), value, oldValue);
            }, this);
            plugins.push(this.labelEditor);
        }

        tpl = Ext.isArray(me.shortcutTpl) ? new Ext.XTemplate(me.shortcutTpl) : me.shortcutTpl;
        tpl.getPos = Ext.Function.bind(function(values){
            var area = this.getComponent(0),
                x = Ext.isString(values.x) ? eval(values.x.replace('{DX}', 'area.getWidth()')) : values.x,
                y = Ext.isString(values.y) ? eval(values.y.replace('{DY}', 'area.getHeight()')) : values.y;
            return Ext.String.format("left:{0}px;top:{1}px;", values.x || values.tempX || 0, values.y || values.tempY || 0);
        }, this);
        
        return {
            xtype: 'dataview',
            overItemCls: 'x-view-over',
            multiSelect: this.multiSelect,
            trackOver: true,
            cls: "ux-desktop-view",
            itemSelector: me.shortcutItemSelector,
            store: me.shortcuts,
            plugins : plugins,
            style: {
                position: 'absolute'
            },
            x: 0, y: 0,
            tpl: tpl,
            selModel : {
                listeners : {
                    "select": function(sm, record){
                        this.resizeShortcutBg(record); 
                    },

                    "deselect": function(sm, record){
                        this.resizeShortcutBg(record); 
                    },

                    scope: this,
                    delay:10
                }
            },
            listeners : {
                "refresh" : this.arrangeShortcuts,
                "itemadd" : this.arrangeShortcuts,
                "itemremove" : this.arrangeShortcuts,
                "itemupdate" : this.onItemUpdate,                
                scope: this,
                buffer: 100
            }
        };
    },

    onItemUpdate : function (record, index, node) {
        this.removeShortcutsDD(record.store, record);
        this.addShortcutsDD(record.store, record);
        this.resizeShortcutBg(record);        
    },

    resizeShortcutBg: function(record){
        var node = Ext.get(this.getComponent(1).getNode(record));
            
        if(!node){
            return;
        }
            
        var wrap = node.child(".ux-desktop-shortcut-wrap"),
            bg = node.child(".ux-desktop-shortcut-bg"),
            w = wrap.getWidth(),
            h = wrap.getHeight();

        bg.setSize(w, h);
        node.setSize(w+2, h+2);
    },

    getFreeCell : function () {
        var x = 0,
            y = 0,
            view = this.getComponent(1),
            width = view.getWidth(),
            height = view.getHeight(),
            occupied,
            isOver;

        while(x < width){
            occupied = false;
            this.shortcuts.each(function(r){
                if(r.data.tempX == x && r.data.tempY == y){
                    occupied = true;
                    return false;
                }
            }, this);

            if(!occupied){
                return [x,y];
            }

            isOver = (y + 91*2 + 10) > height; 

            y = y + 91 + 10;

            if (isOver && y > 10) {            
                x = x + 66 + 10;
                y = 10;
            }

            x = x - (x % 66);
            y = y - (y % 91);
        }

        return [x, y];
    },

    shiftShortcutCell : function(record){
        var x = record.data.tempX,
            y = record.data.tempY,
            view = this.getComponent(1),
            height = view.getHeight(),
            newRecord;

         this.shortcuts.each(function(r){
            if(r.id != record.id && r.data.tempX == x && r.data.tempY == y){
                var node = Ext.get(view.getNode(r)),
                    wrap = node.child(".ux-desktop-shortcut-wrap"),
                    nodeHeight = 91,                    
                    isOver = (y + nodeHeight*2 + 10) > height;

                y = y + nodeHeight + 10;

                if (isOver && y > 10) {            
                    x = x + 66 + 10;
                    y = 10;
                }

                x = x - (x % 66);
                y = y - (y % 91);

                node.setXY([
		            x,
		            y
	            ]);

                r.data.x = "";
                r.data.y = "";
                r.data.tempX = x;
                r.data.tempY = y;
                newRecord = r;
                return false;
            }
         }, this);

         if(newRecord){
            this.shiftShortcutCell(newRecord);
         }
    },

    addShortcutsDD : function (store, records) {
        var me = this,
            view = this.rendered && this.getComponent(1);                           

        if(!this.rendered){
            this.on("afterlayout", function(){
                this.addShortcutsDD(store, records);
            }, this, {delay:500, single:true});

            return;
        }

        if(!view.rendered || !view.viewReady){
            view.on("viewready", function(){
                this.addShortcutsDD(store, records);
            }, this, {delay:500, single:true});

            return;
        }

        Ext.each(records, function(record){
            this.resizeShortcutBg(record);
        }, this);

        if(!this.ddShortcut){
            return;
        }
        
        Ext.each(records, function (r) {
            r.dd = new Ext.dd.DDProxy(view.getNode(r), "desktop-shortcuts-dd"); 
            r.dd.startDrag = function (x, y) {
                var dragEl = Ext.get(this.getDragEl()),
                    el = Ext.get(this.getEl()),
                    view = me.getComponent(1),
                    bg = el.child(".ux-desktop-shortcut-bg"),
                    wrap = el.child(".ux-desktop-shortcut-wrap");

                this.origXY = el.getXY();

                if (!view.isSelected(el)) {
                    view.getSelectionModel().select(view.getRecord(el));
                } 

                dragEl.applyStyles({border:"solid gray 1px"});
                dragEl.update(wrap.dom.innerHTML);
                dragEl.addCls(wrap.dom.className + " ux-desktop-dd-proxy");

                if(me.alignToGrid){
                    this.placeholder = me.body.createChild({
                        tag:"div",
                        cls:"ux-desktop-shortcut-proxy-bg"
                    });
                }

                wrap.hide(false);
                bg.hide(false);
            };

            r.dd.onDrag = function(e){
                if(me.alignToGrid){
                    var left = Ext.fly(this.getDragEl()).getLeft(true), //e.getX(),
                        top = Ext.fly(this.getDragEl()).getTop(true), //e.getY(),
                        xy = {
                            x : (left+33) - ((left+33) % 66),
                            y:  (top+45) - ((top+45) % 91)
                        };

                    this.placeholder.setXY([xy.x, xy.y]);
                }
            };
            
            r.dd.afterDrag = function () {
                var el = Ext.get(this.getEl()),
                    view = me.getComponent(1),
                    record = view.getRecord(el),
                    sm = view.getSelectionModel(),
                    left = el.getLeft(true),
                    top = el.getTop(true),
                    xy = {
                        x : (left+33) - ((left+33) % 66),
                        y:  (top+45) - ((top+45) % 91)
                    },
                    offsetX = xy.x - this.origXY[0],
                    offsetY = xy.y - this.origXY[1];
                    
                if(me.alignToGrid){
                    this.placeholder.destroy();
                }

                if(sm.getCount() > 1){                    
                    Ext.each(sm.getSelection(), function(r){
                        if(r.id != record.id){
                            var node = Ext.get(view.getNode(r)),
                                xy = node.getXY(),
                                ox = xy[0]+offsetX,
                                oy = xy[1]+offsetY;

                            node.setXY([ox,oy]);
                            r.data.x = ox;
                            r.data.y = oy;
                            r.data.tempX = ox;
                            r.data.tempY = oy;
                            if(me.alignToGrid){
                                me.shiftShortcutCell(r);
                            }
                        }
                    }, this);
                }

                el.setXY([xy.x, xy.y]);
                record.data.x = xy.x;
                record.data.y = xy.y;
                record.data.tempX = xy.x;
                record.data.tempY = xy.y;
                el.child(".ux-desktop-shortcut-bg").show(false);
                el.child(".ux-desktop-shortcut-wrap").show(false);
                if(me.alignToGrid){
                    me.shiftShortcutCell(record);
                }
                me.app.fireEvent("shortcutmove", me.app, me.app.getModule(record.data.module), record, xy);
                me.saveState();
            };
        }, this);
    },

    removeShortcutsDD : function (store, record) {        
        if(record.dd){
            record.dd.destroy();
            delete record.dd;            
        }
    },

    onWindowResize : function () {
        this.arrangeShortcuts(false, true);
    },

    arrangeShortcuts : function (ignorePosition, ignoreTemp) {
        var col = { index: 1, x: 10 },
            row = { index: 1, y: 10 },
            records = this.shortcuts.getRange(),
            area = this.getComponent(0),
            view = this.getComponent(1),
            height = area.getHeight();

        for (var i = 0, len = records.length; i < len; i++) {
            var record = records[i],
                tempX = record.get('tempX'),
                tempY = record.get('tempY'),
                x = record.get('x'),
                y = record.get('y'),
                xEmpty = Ext.isEmpty(x),
                yEmpty = Ext.isEmpty(y);

            if(ignoreTemp !== true){
                x = Ext.isEmpty(x) ? tempX : x;
                y = Ext.isEmpty(y) ? tempY : y;
            }

            if (Ext.isEmpty(x) || Ext.isEmpty(y) || ignorePosition === true) {
                this.setShortcutPosition(record, height, col, row, view);
            }
            else {                
                x = !xEmpty && Ext.isString(x) ? eval(x.replace('{DX}', 'area.getWidth()')) : x;
                y = !yEmpty && Ext.isString(y) ? eval(y.replace('{DY}', 'area.getHeight()')) : y;
                x = x - (x % (this.alignToGrid ? 66 : 1));
                y = y - (y % (this.alignToGrid ? 91 : 1));
                Ext.fly(view.getNode(record)).setXY([x, y]);
                if(!xEmpty && !yEmpty){
                    record.data.x = x;
                    record.data.y = y;
                }
                record.data.tempX = x;
                record.data.tempY = y;
            }
        }
    },

    setShortcutPosition : function (record, height, col, row, view) {
        var node = Ext.get(view.getNode(record)),
            wrap = node.child(".ux-desktop-shortcut-wrap"),
            nodeHeight = 91,
            isOver = (row.y + nodeHeight) > height;

        if (isOver && row.y > 10) {            
            col.index = col.index++;
            col.x = col.x + 66 + 10;
            row.index = 1;
            row.y = 10;
        }

        col.x = col.x - (col.x % (this.alignToGrid ? 66 : 1));
        row.y = row.y - (row.y % (this.alignToGrid ? 91 : 1));

        node.setXY([
		    col.x,
		    row.y
	    ]);

        //record.data.x = col.x;
        //record.data.y = row.y;
        record.data.tempX = col.x;
        record.data.tempY = row.y;

        row.index++;
        row.y = row.y + nodeHeight + 10;        
    },    

    createWindowMenu: function () {
        var me = this,
            menu,
            defaultConfig = me.defaultWindowMenu ? {
                defaultAlign: 'br-tr',
                items: [
                    { text: me.restoreText, handler: me.onWindowMenuRestore, scope: me },
                    { text: me.minimizeText, handler: me.onWindowMenuMinimize, scope: me },
                    { text: me.maximizeText, handler: me.onWindowMenuMaximize, scope: me },
                    '-',
                    { text: me.closeText, handler: me.onWindowMenuClose, scope: me }
                ]
            } : {};

        if(me.windowMenu && Ext.isArray(me.windowMenu.items)){
           defaultConfig.items = defaultConfig.items || [];
           defaultConfig.items = defaultWindowMenuItemsFirst ? defaultConfig.items.concat(me.windowMenu.items) : me.windowMenu.items.concat(defaultConfig.items);
           delete me.windowMenu.items;
        }

        menu = new Ext.menu.Menu(Ext.applyIf(me.windowMenu || {}, defaultConfig));
        if(me.defaultWindowMenu){
            menu.on("beforeshow", me.onWindowMenuBeforeShow, me);
        }
        menu.on("hide", me.onWindowMenuHide, me);

        return menu;
    },

    //------------------------------------------------------
    // Event handler methods

    onDesktopMenu: function (e) {
        var me = this, 
            menu = me.contextMenu,
            shortcut = e.getTarget(".ux-desktop-shortcut");
        e.stopEvent();
        if( shortcut && me.shortcutContextMenu){
            me.shortcutContextMenu.module = me.app.getModule(me.getComponent(1).getRecord(shortcut).get('module'));
            me.shortcutContextMenu.showAt(e.getXY());
            me.shortcutContextMenu.doConstrain();            
        }else if(menu){            
            if(shortcut){
                menu.module = me.app.getModule(me.getComponent(1).getRecord(shortcut).get('module'));
            }
            else{
                menu.module = null;
            }
            menu.showAt(e.getXY());
            menu.doConstrain();
        }
    },

    onShortcutItemClick: function (dataView, record) {
        var me = this, module = me.app.getModule(record.data.module),
            win;

        if(module && record.data.handler && Ext.isFunction(record.data.handler)){
            record.data.handler.call(this, module);
        }
        else{
            win = module && module.createWindow();
            if (win) {
              //  me.restoreWindow(win);
            }
        }
    },

    onWindowClose: function(win) {
        var me = this;
        me.windows.remove(win);
        me.taskbar.removeTaskButton(win.taskButton);
        me.updateActiveWindow();
    },

    //------------------------------------------------------
    // Window context menu handlers

    onWindowMenuBeforeShow: function (menu) {
        var me = this,
            items = menu.items.items, 
            win = menu.theWin,
            showMenu = false;

        items[me.defaultWindowMenuItemsFirst ? 0 : (items.length - 5)].setDisabled(win.maximized !== true && win.hidden !== true).setVisible(win.minimizable || win.maximizable); // Restore
        items[me.defaultWindowMenuItemsFirst ? 1 : (items.length - 4)].setDisabled(win.minimized === true).setVisible(win.minimizable); // Minimize
        items[me.defaultWindowMenuItemsFirst ? 2 : (items.length - 3)].setDisabled(win.maximized === true || win.hidden === true).setVisible(win.maximizable); // Maximize
        items[me.defaultWindowMenuItemsFirst ? 3 : (items.length - 2)].setVisible(((win.minimizable || win.maximizable) && win.closable) && (win.minimizable || win.maximizable || win.closable)); // Separator
        items[me.defaultWindowMenuItemsFirst ? 4 : (items.length - 1)].setVisible(win.closable); // Close

        Ext.Array.each(items, function(item) {
            if (!item.hidden) {
                showMenu = true;
                return false;
            }
        });

        return showMenu;
    },

    onWindowMenuClose: function () {
        var me = this, win = me.windowMenu.theWin;

        win.close();
    },

    onWindowMenuHide: function (menu) {
        Ext.defer(function() {
            menu.theWin = null;
        }, 1);
    },

    onWindowMenuMaximize: function () {
        var me = this, win = me.windowMenu.theWin;

        win.maximize();
        win.toFront();
    },

    onWindowMenuMinimize: function () {
        var me = this, win = me.windowMenu.theWin;

        win.minimize();
    },

    onWindowMenuRestore: function () {
        var me = this, win = me.windowMenu.theWin;

        me.restoreWindow(win);
    },

    //------------------------------------------------------
    // Dynamic (re)configuration methods

    getWallpaper: function () {
        return this.wallpaper.wallpaper;
    },

    setTickSize: function(xTickSize, yTickSize) {
        var me = this,
            xt = me.xTickSize = xTickSize,
            yt = me.yTickSize = (arguments.length > 1) ? yTickSize : xt;

        me.windows.each(function(win) {
            var dd = win.dd, resizer = win.resizer;
            dd.xTickSize = xt;
            dd.yTickSize = yt;
            resizer.widthIncrement = xt;
            resizer.heightIncrement = yt;
        });
    },

    setWallpaper: function (wallpaper, stretch) {
        this.wallpaper.setWallpaper(wallpaper, stretch);
        return this;
    },

    //------------------------------------------------------
    // Window management methods    

    showWindow : function (config, cls) {
        var w = this.createWindow(config, cls);
        w.show();
        return w;
    },

    centerWindow : function () {
        var me = this,
            xy;
            
        if (me.isVisible()) {
            xy = me.el.getAlignToXY(me.desktop.body, 'c-c');
            me.setPagePosition(xy);
        } else {
            me.needsCenter = true;
        }

        return me;
    },

    createWindow : function (config, cls) {
        var me = this, 
            win, 
            availWidth,
            availHeight,
            cfg = Ext.applyIf(config || {}, {
                stateful: false,
                isWindow: true,
                constrainHeader: true,
                minimizable: true,
                maximizable: true,
                center: me.centerWindow,                
                desktop: me
            });

        cls = cls || Ext.window.Window;
        win = me.add(new cls(cfg));

        if (cfg.maximized) {
            win.restorePos = [20,20];
        }

        me.windows.add(win);

        win.taskButton = me.taskbar.addTaskButton(win);
        win.animateTarget = win.taskButton.el;
        
        win.on({
            activate    : me.updateActiveWindow,
            beforeshow  : me.updateActiveWindow,
            deactivate  : me.updateActiveWindow,
            minimize    : me.minimizeWindow,
            destroy     : me.onWindowClose,
            titlechange : function (win) {
                if (win.taskButton) {
                    win.taskButton.setText(win.title);
                }
            },
            iconchange : function (win) {
                if (win.taskButton) {
                    win.taskButton.setIconCls(win.iconCls);
                }
            },
            scope : me
        });

        win.on({
            boxready : function () {
                if (win.dd) {
                    win.dd.xTickSize = me.xTickSize;
                    win.dd.yTickSize = me.yTickSize;
                }

                if (win.resizer) {
                    win.resizer.widthIncrement = me.xTickSize;
                    win.resizer.heightIncrement = me.yTickSize;
                }
            },
            single: true
        });

        if (win.closeAction == "hide") {
            win.on("close", function (win) {
                this.onWindowClose(win);
            }, this);
        } else {
            // replace normal window close w/fadeOut animation:
            win.doClose = function ()  {
                win.doClose = Ext.emptyFn; // dblclick can call again...
                win.el.disableShadow();
                win.el.fadeOut({
                    listeners : {
                        afteranimate : function () {
                            win.destroy();
                        }
                    }
                });
            };
        }

        availWidth = me.body.getWidth(true);
        availHeight = me.body.getHeight(true);

        if (win.height > availHeight) {
            win.height = availHeight;
        }

        if (win.width > availWidth) {
            win.width = availWidth;
        }

        return win;
    },

    getActiveWindow : function () {
        var win = null,
            zmgr = this.getDesktopZIndexManager();

        if (zmgr) {
            // We cannot rely on activate/deactive because that fires against non-Window
            // components in the stack.

            zmgr.eachTopDown(function (comp) {
                if (comp.isWindow && !comp.hidden) {
                    win = comp;
                    return false;
                }
                return true;
            });
        }

        return win;
    },

    getDesktopZIndexManager : function () {
        var windows = this.windows;
        // TODO - there has to be a better way to get this...
        return (windows.getCount() && windows.getAt(0).zIndexManager) || null;
    },

    getWindow : function (id) {
        return this.windows.get(id);
    },

    getModuleWindow : function (id) {
        var win;
        this.windows.each(function (w) {
            if (w.moduleId == id) {
                win = w;
                return false;
            }
        });
        return win;
    },

    minimizeWindow : function (win) {
        win.minimized = true;
        win.hide();
    },

    restoreWindow : function (win) {
        if (win.isVisible()) {
            win.restore();
            win.toFront();
        } else {
            win.show();
        }

        return win;
    },

    tileWindows : function () {
        var me = this, 
            availWidth = me.body.getWidth(true),
            x = me.xTickSize, 
            y = me.yTickSize, 
            nextY = y;

        me.windows.each(function (win) {
            if (win.isVisible() && !win.maximized) {
                var w = win.el.getWidth();

                // Wrap to next row if we are not at the line start and this Window will
                // go off the end
                if (x > me.xTickSize && x + w > availWidth) {
                    x = me.xTickSize;
                    y = nextY;
                }

                win.setPosition(x, y);
                x += w + me.xTickSize;
                nextY = Math.max(nextY, y + win.el.getHeight() + me.yTickSize);
            }
        });
    },

    cascadeWindows: function() {
        var x = 0, 
            y = 0,
            zmgr = this.getDesktopZIndexManager();

        if(zmgr){
            zmgr.eachBottomUp(function(win) {
                if (win.isWindow && win.isVisible() && !win.maximized) {
                    win.setPosition(x, y);
                    x += 20;
                    y += 20;
                }
            });
        }
    },

    checkerboardWindows : function() {
      var me = this, 
          availWidth = me.body.getWidth(true),
          availHeight = me.body.getHeight(true),
          x = 0, 
          y = 0,
          lastx = 0, 
          lasty = 0,
          square = 400;

      me.windows.each(function(win) {         
         if (win.isVisible()) {            
            win.setWidth(square);
            win.setHeight(square);

            win.setPosition(x, y);
            x += square;

            if (x + square > availWidth) {
               x = lastx;
               y += square;

               if (y > availHeight) {
                  lastx += 20;
                  lasty += 20;
                  x = lastx;
                  y = lasty;
               }
            }
         }
      }, me);
   },

   snapFitWindows : function() {
       var me = this, 
          availWidth = me.body.getWidth(true),
          availHeight = me.body.getHeight(true),
          x = 0, 
          y = 0,
          snapCount = 0,
          snapSize;

      me.windows.each(function(win) {
         if (win.isVisible()) {
            snapCount++;
         }
      });

      snapSize = parseInt(availWidth / snapCount);

      if (snapSize > 0) {
         me.windows.each(function(win) {
            if (win.isVisible()) {          
               win.setWidth(snapSize);
               win.setHeight(availHeight);

               win.setPosition(x, y);
               x += snapSize;
            }
         });
      }
   },

   snapFitVWindows : function(){
      var me = this, 
          availWidth = me.body.getWidth(true),
          availHeight = me.body.getHeight(true),
          x = 0, 
          y = 0,
          snapCount = 0,
          snapSize;

      me.windows.each(function(win) {
         if (win.isVisible()) {
            snapCount++;
         }
      });

      snapSize = parseInt(availHeight / snapCount);

      if (snapSize > 0) {
         me.windows.each(function(win) {
            if (win.isVisible()) {           
               win.setWidth(availWidth);
               win.setHeight(snapSize);

               win.setPosition(x, y);
               y += snapSize;
            }
         });
      }
   },

   closeWindows : function() {
      this.windows.each(function(win) {
         win.close();
      });
   },

   minimizeWindows : function() {
      this.windows.each(function(win) {
         this.minimizeWindow(win);
      }, this);
   },

    updateActiveWindow : function () {
        var me = this, activeWindow = me.getActiveWindow(), last = me.lastActiveWindow;
        if (activeWindow === last) {
            return;
        }

        if (last) {
            if (last.el.dom) {
                last.addCls(me.inactiveWindowCls);
                last.removeCls(me.activeWindowCls);
            }

            last.active = false;
        }

        me.lastActiveWindow = activeWindow;

        if (activeWindow) {
            activeWindow.addCls(me.activeWindowCls);
            activeWindow.removeCls(me.inactiveWindowCls);
            activeWindow.minimized = false;
            activeWindow.active = true;
        }

        me.taskbar.setActiveButton(activeWindow && activeWindow.taskButton);
    }
});



Ext.define('Ext.ux.desktop.App', {
    mixins: {
        observable: 'Ext.util.Observable'
    },
    
    requires: [
        'Ext.container.Viewport',

        'Ext.ux.desktop.Desktop'
    ],

    isReady: false,
    modules: null,

    constructor: function (config) {
        var me = this;
        me.addEvents(
            'ready',
            "shortcutmove",
            "shortcutnameedit",
            'beforeunload'
        );
        Ext.net.Desktop = this;
        me.mixins.observable.constructor.call(this, config);

        if (Ext.isReady) {
            Ext.Function.defer(me.init, 10, me);
        } else {
            Ext.onReady(me.init, me);
        }
    },

    init: function() {
        var me = this, desktopCfg;

        me.modules = me.getModules() || [];
        me.getModules = function () {
            return this.modules;
        };
        if (me.modules) {
            me.initModules(me.modules);
        }

        desktopCfg = me.getDesktopConfig();
        me.desktop = new Ext.ux.desktop.Desktop(desktopCfg);

        me.viewport = new Ext.net.Viewport({
            layout: 'fit',
            items: [ me.desktop ]
        });

        Ext.EventManager.on(window, 'beforeunload', me.onUnload, me);

        Ext.each(me.modules, function(module){
            if(module.autoRun){
                module.autoRunHandler ? module.autoRunHandler() : module.createWindow();
            }
        });

        me.isReady = true;
        me.fireEvent('ready', me);        
    },

    
    getDesktopConfig: function () {
        var me = this, cfg = {
            app: me,
            taskbarConfig: me.getTaskbarConfig()
        };

        Ext.apply(cfg, me.desktopConfig);
        return cfg;
    },

    getModules: Ext.emptyFn,

    
    getStartConfig: function () {
        var me = this, cfg = {
            app: me,
            menu: []
        };

        Ext.apply(cfg, me.startConfig);

        Ext.each(me.modules, function (module) {
            if (module.launcher) {
                if(!(module.launcher.handler || module.launcher.listeners && module.launcher.listeners.click)){
                    module.launcher.handler = function() {
                        this.createWindow();
                    };
                    module.launcher.scope = module;
                }
                module.launcher.moduleId = module.id;
                cfg.menu.push(module.launcher);
            }
        });

        return cfg;
    },

    
    getTaskbarConfig: function () {
        var me = this, cfg = {
            app: me,
            startConfig: me.getStartConfig()
        };

        Ext.apply(cfg, me.taskbarConfig);
        return cfg;
    },

    initModules : function(modules) {
        var me = this,
            m,
            _modules = [],
            i = 0,
            len = (modules || []).length;        

        for (; i < len; i++ ) {
            m = modules[i];
            if (m) {
                m.app = me;
                _modules.push(m)
            }
        }

        me.modules = _modules;
    },

    getModule : function(name) {
    	var ms = this.modules;
        for (var i = 0, len = ms.length; i < len; i++) {
            var m = ms[i];
            if (m.id == name || m.appType == name) {
                return m;
            }
        }
        return null;
    },

    onReady : function(fn, scope) {
        if (this.isReady) {
            fn.call(scope, this);
        } else {
            this.on({
                ready: fn,
                scope: scope,
                single: true
            });
        }
    },

    getDesktop : function() {
        return this.desktop;
    },

    onUnload : function(e) {
        if (this.fireEvent('beforeunload', this) === false) {
            e.stopEvent();
        }
    },

    addModule : function (module){
        this.removeModule(module.id);
        this.modules.push(module);        
         
         module.app = this;

         if(module.shortcut){            
            var s = this.desktop.shortcutDefaults ? Ext.applyIf(module.shortcut, this.desktop.shortcutDefaults) : module.shortcut,
                xy;
            if(Ext.isEmpty(s.x) || Ext.isEmpty(s.y)){
                xy = this.desktop.getFreeCell();
                s.tempX = xy[0];
                s.tempY = xy[1];
            }

            this.desktop.shortcuts.add(s);
            
            //this.desktop.arrangeShortcuts(false, true);
         }

         if(module.launcher){
            if(!(module.launcher.handler || module.launcher.listeners && module.launcher.listeners.click)){
                module.launcher.handler = function() {
                    this.createWindow();
                };
                module.launcher.scope = module;                
            }
            module.launcher.moduleId = module.id;
            this.desktop.taskbar.startMenu.menu.add(module.launcher);
         }

         if(module.autoRun){
            module.autoRunHandler ? module.autoRunHandler() : module.createWindow();
         }
    },

    removeModule : function (id){
        var module = this.getModule(id);
        if(module){
            module.app = null;
            Ext.Array.remove(this.modules, module);
            var r = this.desktop.shortcuts.getById(id);
            if(r){
                this.desktop.shortcuts.remove(r);
            }

            var launcher = this.desktop.taskbar.startMenu.menu.child('[moduleId="'+id+'"]');
            if(launcher){
                this.desktop.taskbar.startMenu.menu.remove(launcher, true);
            }

            var window = this.desktop.getModuleWindow(id);
            if(window){
                window.destroy();
            }
        }
    }
});

Ext.ux.desktop.App.override(Ext.util.DirectObservable);



Ext.define('Ext.ux.DataView.DragSelector', {
    requires: ['Ext.dd.DragTracker', 'Ext.util.Region'],

    
    init: function(dataview) {
        
        this.dataview = dataview;
        dataview.mon(dataview, {
            beforecontainerclick: this.cancelClick,
            scope: this,
            render: {
                fn: this.onRender,
                scope: this,
                single: true
            }
        });
    },

    
    onRender: function() {
        
        this.tracker = Ext.create('Ext.dd.DragTracker', {
            dataview: this.dataview,
            el: this.dataview.el,
            dragSelector: this,
            onBeforeStart: this.onBeforeStart,
            onStart: this.onStart,
            onDrag : this.onDrag,
            onEnd  : this.onEnd
        });

        
        this.dragRegion = Ext.create('Ext.util.Region');
    },

    
    onBeforeStart: function(e) {
        return e.target == this.dataview.getEl().dom;
    },

    
    onStart: function(e) {
        var dragSelector = this.dragSelector,
            dataview     = this.dataview;

        // Flag which controls whether the cancelClick method vetoes the processing of the DataView's containerclick event.
        // On IE (where else), this needs to remain set for a millisecond after mouseup because even though the mouse has
        // moved, the mouseup will still trigger a click event.
        this.dragging = true;

        //here we reset and show the selection proxy element and cache the regions each item in the dataview take up
        dragSelector.fillRegions();
        dragSelector.getProxy().show();
        dataview.getSelectionModel().deselectAll();
    },

    
    cancelClick: function() {
        return !this.tracker.dragging;
    },

    
    onDrag: function(e) {
        var dragSelector = this.dragSelector,
            selModel     = dragSelector.dataview.getSelectionModel(),
            dragRegion   = dragSelector.dragRegion,
            bodyRegion   = dragSelector.bodyRegion,
            proxy        = dragSelector.getProxy(),
            regions      = dragSelector.regions,
            length       = regions.length,

            startXY   = this.startXY,
            currentXY = this.getXY(),
            minX      = Math.min(startXY[0], currentXY[0]),
            minY      = Math.min(startXY[1], currentXY[1]),
            width     = Math.abs(startXY[0] - currentXY[0]),
            height    = Math.abs(startXY[1] - currentXY[1]),
            region, selected, i;

        Ext.apply(dragRegion, {
            top: minY,
            left: minX,
            right: minX + width,
            bottom: minY + height
        });

        dragRegion.constrainTo(bodyRegion);
        proxy.setRegion(dragRegion);

        for (i = 0; i < length; i++) {
            region = regions[i];
            selected = dragRegion.intersect(region);

            if (selected) {
                selModel.select(i, true);
            } else {
                selModel.deselect(i);
            }
        }
    },

    
    onEnd: Ext.Function.createDelayed(function(e) {
        var dataview = this.dataview,
            selModel = dataview.getSelectionModel(),
            dragSelector = this.dragSelector;

        this.dragging = false;
        dragSelector.getProxy().hide();
    }, 1),

    
    getProxy: function() {
        if (!this.proxy) {
            this.proxy = this.dataview.getEl().createChild({
                tag: 'div',
                cls: 'x-view-selector'
            });
        }
        return this.proxy;
    },

    
    fillRegions: function() {
        var dataview = this.dataview,
            regions  = this.regions = [];

        dataview.all.each(function(node) {
            regions.push(node.getRegion());
        });
        this.bodyRegion = dataview.getEl().getRegion();
    }
});



Ext.define('Ext.ux.DataView.LabelEditor', {

    extend: 'Ext.Editor',

    alignment: 'tl-tl',

    completeOnEnter: true,

    cancelOnEsc: true,

    shim: false,

    autoSize: {
        width: 'boundEl',
        height: 'field'
    },

    labelSelector: 'x-editable',

    requires: [
        'Ext.form.field.Text'
    ],

    constructor: function(config) {
        config.field = config.field || Ext.create('Ext.form.field.Text', {
            allowOnlyWhitespace: false,
            selectOnFocus:true
        });
        this.callParent([config]);
    },

    init: function(view) {
        this.view = view;
        this.mon(view, 'render', this.bindEvents, this);
        this.on('complete', this.onSave, this);
    },

    // initialize events
    bindEvents: function() {
        this.mon(this.view.getEl(), {
            click: {
                fn: this.onClick,
                scope: this
            }
        });
    },

    // on mousedown show editor
    onClick: function(e, target) {
        var me = this,
            item, record;

        if (Ext.fly(target).hasCls(me.labelSelector) && !me.editing && !e.ctrlKey && !e.shiftKey) {
            e.stopEvent();
            item = me.view.findItemByChild(target);
            record = me.view.store.getAt(me.view.indexOf(item));
            me.startEdit(target, record.data[me.dataIndex]);
            me.activeRecord = record;
        } else if (me.editing) {
            me.field.blur();
            e.preventDefault();
        }
    },

    // update record
    onSave: function(ed, value) {
        this.activeRecord.set(this.dataIndex, value);
    }
});




Ext.define('Ext.ux.DataView.Animated', {

    
    defaults: {
        duration  : 750,
        idProperty: 'id'
    },
    
    
    constructor: function(config) {
        Ext.apply(this, config || {}, this.defaults);
    },

    
    init: function(dataview) {
        
        this.dataview = dataview;
        
        var store = dataview.store;
        
        dataview.blockRefresh = true;
        dataview.updateIndexes = Ext.Function.createSequence(dataview.updateIndexes, function() {
            this.getTargetEl().select(this.itemSelector).each(function(element, composite, index) {
                element.id = element.dom.id = Ext.util.Format.format("{0}-{1}", dataview.id, store.getAt(index).internalId);
            }, this);
        }, dataview);
        
        
        this.dataviewID = dataview.id;
        
        
        this.cachedStoreData = {};
        
        //catch the store data with the snapshot immediately
        this.cacheStoreData(store.data || store.snapshot);

        dataview.on('resize', function() {
            var store = dataview.store;
            if (store.getCount() > 0) {
                reDraw.call(this, store);
            }
        }, this);
        
        dataview.store.on('load', function(){
            this.cachedStoreData = {};        
            this.cacheStoreData(store.data || store.snapshot);
            dataview.blockRefresh = false;
            dataview.refresh();
            dataview.blockRefresh = true;
        }, this);

        dataview.store.on('datachanged', reDraw, this, {delay:100});
        
        function reDraw(store) {
            var parentEl = dataview.getTargetEl(),
                calcItem = store.getAt(0),
                added    = this.getAdded(store),
                removed  = this.getRemoved(store),
                previous = this.getRemaining(store);

            // Not yet rendered
            if (!parentEl) {
                return;
            }

            //make sure the correct styles are applied to the parent element
            if (Ext.isIEQuirks) {
                parentEl.applyStyles({
                    zoom: 1,
                    display : 'block',
                    position: 'relative'
                });
            }
            
            //hide old items
            Ext.each(removed, function(item) {
                var id = this.dataviewID + '-' + item.internalId;
                Ext.fly(id).animate({
                    remove  : false,
                    duration: duration,
                    opacity : 0,
                    useDisplay: true,
                    callback: function() {
                        Ext.fly(id).setDisplayed(false);
                    }
                });
            }, this);
            
            //store is empty
            if (calcItem == undefined) {
                this.cacheStoreData(store);
                return;
            }
            
            this.cacheStoreData(store);
            
            var el = Ext.get(this.dataviewID + "-" + calcItem.internalId);
            
            //if there is nothing rendered, force a refresh and return. This happens when loading asynchronously (was not
            //covered correctly in previous versions, which only accepted local data)
            if (!el) {
                dataview.refresh();
                return true;
            }
            
            //calculate the number of rows and columns we have
            var itemWidth   = el.getMargin('lr') + el.getWidth(),
                itemHeight  = el.getMargin('bt') + el.getHeight(),
                dvWidth     = parentEl.dom.clientWidth,
                columns     = Math.floor(dvWidth / itemWidth),
                rtl = this.dataview.getHierarchyState().rtl,
                styleSide = rtl ? 'right' : 'left',
                newStyle;
            
            //stores the current top and left values for each element (discovered below)
            var oldPositions = {},
                newPositions = {},
                elCache      = {};
            
            //find current positions of each element and save a reference in the elCache
            Ext.iterate(previous, function(id, item) {
                var id = item.internalId,
                    el = elCache[id] = Ext.get(this.dataviewID + '-' + id);

                oldPositions[id] = {
                    top : el.getY()  - parentEl.getY()  - el.getMargin('t') - parentEl.getPadding('t')
                };
                oldPositions[id][styleSide] = this.getItemX(el);
            }, this);
            
            //set absolute positioning on all DataView items. We need to set position, left and 
            //top at the same time to avoid any flickering
            Ext.iterate(previous, function(id, item) {
                var oldPos = oldPositions[id],
                    el     = elCache[id];

                if (el.getStyle('position') != 'absolute') {
                    newStyle = {
                        position: 'absolute',
                        top     : oldPos.top + "px"
                    };
                    newStyle[styleSide] = oldPos[styleSide] + "px";
                    elCache[id].applyStyles(newStyle);
                }
            });
            
            //get new positions
            var index = 0;
            Ext.iterate(store.data.items, function(item) {
                var id = item.internalId,
                    column = index % columns,
                    row    = Math.floor(index / columns),
                    top    = row    * itemHeight,
                    left   = column * itemWidth;

                newPositions[id] = {
                    top : top
                };
                newPositions[id][styleSide] = left;
                
                index ++;
            }, this);
            
            //do the movements
            var startTime  = new Date(),
                duration   = this.duration,
                dataviewID = this.dataviewID;
            
            var doAnimate = function() {
                var elapsed  = new Date() - startTime,
                    fraction = elapsed / duration,
                    id;

                if (fraction >= 1) {
                    for (id in newPositions) {
                        newStyle = {
                            top : newPositions[id].top + "px"
                        };
                        newStyle[styleSide] = newPositions[id][styleSide] + "px";
                        
                        Ext.fly(dataviewID + '-' + id).applyStyles(newStyle);
                    }

                    Ext.TaskManager.stop(task);
                } else {
                    //move each item
                    for (id in newPositions) {
                        if (!previous[id]) {
                            continue;
                        }
                        
                        var oldPos  = oldPositions[id],
                            newPos  = newPositions[id],
                            oldTop  = oldPos.top,
                            newTop  = newPos.top,
                            oldLeft = oldPos[styleSide],
                            newLeft = newPos[styleSide],
                            diffTop = fraction * Math.abs(oldTop  - newTop),
                            diffLeft= fraction * Math.abs(oldLeft - newLeft),
                            midTop  = oldTop  > newTop  ? oldTop  - diffTop  : oldTop  + diffTop,
                            midLeft = oldLeft > newLeft ? oldLeft - diffLeft : oldLeft + diffLeft;

                        newStyle = {
                            top : midTop + "px"
                        };
                        newStyle[styleSide] = midLeft + "px";
                        Ext.fly(dataviewID + '-' + id).applyStyles(newStyle).setDisplayed(true);
                    }
                }
            };
            
            var task = {
                run     : doAnimate,
                interval: 20,
                scope   : this
            };
            
            Ext.TaskManager.start(task);
            
            //show new items
            Ext.iterate(added, function(id, item) {
                newStyle = {
                    top    : newPositions[item.internalId].top + "px"
                };
                newStyle[styleSide] = newPositions[item.internalId][styleSide] + "px";
                Ext.fly(this.dataviewID + '-' + item.internalId).applyStyles(newStyle).setDisplayed(true);
                
                Ext.fly(this.dataviewID + '-' + item.internalId).animate({
                    remove  : false,
                    duration: duration,
                    opacity : 1
                });
            }, this);
            
            this.cacheStoreData(store);
        }
    },
    
    getItemX: function(el) {
        var rtl = this.dataview.getHierarchyState().rtl,
            parentEl = el.up('');

        if (rtl) {
            return parentEl.getViewRegion().right - el.getRegion().right + el.getMargin('r');
        } else {
            return el.getX() - parentEl.getX() - el.getMargin('l') - parentEl.getPadding('l');
        }
    },
    
    
    cacheStoreData: function(store) {
        this.cachedStoreData = {};
        
        store.each(function(record) {
             this.cachedStoreData[record.internalId] = record;
        }, this);
    },
    
    
    getExisting: function() {
        return this.cachedStoreData;
    },
    
    
    getExistingCount: function() {
        var count = 0,
            items = this.getExisting();
        
        for (var k in items) {
            count++;
        }
        
        return count;
    },
    
    
    getAdded: function(store) {
        var added = {};
        
        store.each(function(record) {
            if (this.cachedStoreData[record.internalId] == undefined) {
                added[record.internalId] = record;
            }
        }, this);
        
        return added;
    },
    
    
    getRemoved: function(store) {
        var removed = [],
            id;
        
        for (id in this.cachedStoreData) {
            if (store.findBy(function(record) {return record.internalId == id;}) == -1) {
                removed.push(this.cachedStoreData[id]);
            }
        }
        
        return removed;
    },
    
    
    getRemaining: function(store) {
        var remaining = {};

        store.each(function(record) {
            if (this.cachedStoreData[record.internalId] != undefined) {
                remaining[record.internalId] = record;
            }
        }, this);
        
        return remaining;
    }
});

Ext.define('Ext.ux.DataView.Draggable', {
    requires: 'Ext.dd.DragZone',

    
    ghostCls: 'x-dataview-draggable-ghost',

    
    ghostTpl: [
        '<tpl for=".">',
            '{title}',
        '</tpl>'
    ],

    

    

    constructor: function(config) {
        Ext.apply(this, config || {});
    },

    init: function(dataview) {
        
        this.dataview = dataview;

        dataview.on('render', this.onRender, this);

        Ext.apply(this, {
            itemSelector: dataview.itemSelector,
            ghostConfig : {}
        });

        Ext.applyIf(this.ghostConfig, {
            itemSelector: 'img',
            cls: this.ghostCls,
            tpl: this.ghostTpl
        });
    },

    
    onRender: function() {
        var config = Ext.apply({}, this.ddConfig || {}, {
            dvDraggable: this,
            dataview   : this.dataview,
            getDragData: this.getDragData,
            getTreeNode: this.getTreeNode,
            afterRepair: this.afterRepair,
            getRepairXY: this.getRepairXY
        });

        
        this.dragZone = Ext.create('Ext.dd.DragZone', this.dataview.getEl(), config);
    },

    getDragData: function(e) {
        var draggable = this.dvDraggable,
            dataview  = this.dataview,
            selModel  = dataview.getSelectionModel(),
            target    = e.getTarget(draggable.itemSelector),
            selected, dragData;

        if (target) {
            if (!dataview.isSelected(target)) {
                selModel.select(dataview.getRecord(target));
            }

            selected = dataview.getSelectedNodes();
            dragData = {
                copy: true,
                nodes: selected,
                records: selModel.getSelection(),
                item: true
            };

            if (selected.length == 1) {
                dragData.single = true;
                dragData.ddel = target;
            } else {
                dragData.multi = true;
                dragData.ddel = draggable.prepareGhost(selModel.getSelection()).dom;
            }

            return dragData;
        }

        return false;
    },

    getTreeNode: function() {
        // console.log('test');
    },

    afterRepair: function() {
        this.dragging = false;

        var nodes  = this.dragData.nodes,
            length = nodes.length,
            i;

        //FIXME: Ext.fly does not work here for some reason, only frames the last node
        for (i = 0; i < length; i++) {
            Ext.get(nodes[i]).frame('#8db2e3', 1);
        }
    },

    
    getRepairXY: function(e) {
        if (this.dragData.multi) {
            return false;
        } else {
            var repairEl = Ext.get(this.dragData.ddel),
                repairXY = repairEl.getXY();

            //take the item's margins and padding into account to make the repair animation line up perfectly
            repairXY[0] += repairEl.getPadding('t') + repairEl.getMargin('t');
            repairXY[1] += repairEl.getPadding('l') + repairEl.getMargin('l');

            return repairXY;
        }
    },

    
    prepareGhost: function(records) {
        var ghost = this.createGhost(records),
            store = ghost.store;

        store.removeAll();
        store.add(records);

        return ghost.getEl();
    },

    
    createGhost: function(records) {
        if (!this.ghost) {
            var ghostConfig = Ext.apply({}, this.ghostConfig, {
                store: Ext.create('Ext.data.Store', {
                    model: records[0].modelName
                })
            });

            this.ghost = Ext.create('Ext.view.View', ghostConfig);

            this.ghost.render(document.createElement('div'));
        }

        return this.ghost;
    }
});



Ext.define('Ext.app.Portlet', {
    extend : 'Ext.panel.Panel',
    alias  : 'widget.portlet',
    layout : 'fit',
    anchor : '100%',
    frame  : true,
    closable     : true,
    collapsible  : true,
    animCollapse : true,
    draggable    : {
        moveOnDrag : false    
    },
    cls : 'x-portlet',

    // Override Panel's default doClose to provide a custom fade out effect
    // when a portlet is removed from the portal
    doClose : function () {
	    if (!this.closing) {
            this.closing = true;
            this.el.animate({
                opacity  : 0,
                callback : function(){
                    var closeAction = this.closeAction;
                    this.closing = false;
                    this.fireEvent('close', this);
                    this[closeAction]();
                    if (closeAction == 'hide') {
                        this.el.setOpacity(1);
                    }
                },
                scope : this
            });
	    }
    }
});


Ext.define('Ext.app.PortalColumn', {
    extend      : 'Ext.container.Container',
    alias       : 'widget.portalcolumn',
    layout      : 'anchor',
    defaultType : 'portlet',
    cls         : 'x-portal-column'

    // This is a class so that it could be easily extended
    // if necessary to provide additional behavior.
});


Ext.define('Ext.app.PortalPanel', {
    extend   : 'Ext.panel.Panel',
    alias    : 'widget.portalpanel',
    
    cls         : 'x-portal',
    bodyCls     : 'x-portal-body',
    defaultType : 'portalcolumn',
    autoScroll  : true,

    initComponent : function () {
        var me = this;

        // Implement a Container beforeLayout call from the layout to this Container
        this.layout = {
            type : 'column'
        };
        this.callParent();

        this.addEvents({
            validatedrop   : true,
            beforedragover : true,
            dragover       : true,
            beforedrop     : true,
            drop           : true
        });
        this.on('drop', this.doLayout, this);
    },

    // Set columnWidth, and set first and last column classes to allow exact CSS targeting.
    beforeLayout: function () {
        var items = this.layout.getLayoutItems(),
            len = items.length,
            i = 0,
            cw = 1,
            cwCount = len,
            item;
  
        for (i = 0; i < len; i++) {
            item = items[i];
  
            if (item.columnWidth) {
                cw -= item.columnWidth || 0;
                cwCount--;
            }
        }
  
        for (i = 0; i < len; i++) {
            item = items[i];
            if (!item.columnWidth) {
                item.columnWidth = cw / cwCount;
            }
            item.removeCls(['x-portal-column-first', 'x-portal-column-last']);
        }
  
        if (items.length > 0) {
            items[0].addCls('x-portal-column-first');
            items[len - 1].addCls('x-portal-column-last');
        }
  
        return this.callParent(arguments);
    },

    // private
    initEvents : function(){
        this.callParent();
        this.dd = Ext.create('Ext.app.PortalDropZone', this, this.dropConfig);
    },

    // private
    beforeDestroy : function() {
        if (this.dd) {
            this.dd.unreg();
        }
        this.callParent();
    }
});


Ext.define('Ext.app.PortalDropZone', {
    extend : 'Ext.dd.DropTarget',

    constructor : function (portal, cfg) {
        this.portal = portal;
        Ext.dd.ScrollManager.register(portal.body);
        Ext.app.PortalDropZone.superclass.constructor.call(this, portal.body, cfg);
        portal.body.ddScrollConfig = this.ddScrollConfig;
    },

    ddScrollConfig : {
        vthresh   : 50,
        hthresh   : -1,
        animate   : true,
        increment : 200
    },

    createEvent : function (dd, e, data, col, c, pos) {
        return {
            portal   : this.portal,
            panel    : data.panel,
            columnIndex : col,
            column   : c,
            position : pos,
            data     : data,
            source   : dd,
            rawEvent : e,
            status   : this.dropAllowed
        };
    },

    notifyOver : function (dd, e, data) {
        var xy = e.getXY(),
            portal = this.portal,
            proxy = dd.proxy;

        // case column widths
        if (!this.grid) {
            this.grid = this.getGrid();
        }

        // handle case scroll where scrollbars appear during drag
        var cw = portal.body.dom.clientWidth;

        if (!this.lastCW) {
            // set initial client width
            this.lastCW = cw;
        } else if (this.lastCW != cw) {
            // client width has changed, so refresh layout & grid calcs
            this.lastCW = cw;
            //portal.doLayout();
            this.grid = this.getGrid();
        }

        // determine column
        var colIndex = 0,
            colRight = 0,
            cols = this.grid.columnX,
            len = cols.length,
            cmatch = false;

        for (len; colIndex < len; colIndex++) {
            colRight = cols[colIndex].x + cols[colIndex].w;

            if (xy[0] < colRight) {
                cmatch = true;
                break;
            }
        }

        // no match, fix last index
        if (!cmatch) {
            colIndex--;
        }

        // find insert position
        var overPortlet, pos = 0,
            h = 0,
            match = false,
            overColumn = portal.items.getAt(colIndex),
            portlets = overColumn.items.items,
            overSelf = false;

        len = portlets.length;

        for (len; pos < len; pos++) {
            overPortlet = portlets[pos];
            h = overPortlet.el.getHeight();

            if (h === 0) {
                overSelf = true;
            } else if ((overPortlet.el.getY() + (h / 2)) > xy[1]) {
                match = true;
                break;
            }
        }

        pos = (match && overPortlet ? pos : overColumn.items.getCount()) + (overSelf ? -1 : 0);
        var overEvent = this.createEvent(dd, e, data, colIndex, overColumn, pos);

        if (portal.fireEvent('validatedrop', overEvent) !== false && portal.fireEvent('beforedragover', overEvent) !== false) {
            // make sure proxy width is fluid in different width columns
            proxy.getProxy().setWidth('auto');
            if (overPortlet) {
                dd.panelProxy.moveProxy(overPortlet.el.dom.parentNode, match ? overPortlet.el.dom : null);
            } else {
                dd.panelProxy.moveProxy(overColumn.el.dom, null);
            }

            this.lastPos = {
                c   : overColumn,
                col : colIndex,
                p   : overSelf || (match && overPortlet) ? pos : false
            };

            this.scrollPos = portal.body.getScroll();

            portal.fireEvent('dragover', overEvent);
            return overEvent.status;
        } else {
            return overEvent.status;
        }

    },

    notifyOut : function () {
        delete this.grid;
    },

    notifyDrop : function (dd, e, data) {
        delete this.grid;

        if (!this.lastPos) {
            return;
        }

        var c = this.lastPos.c,
            col = this.lastPos.col,
            pos = this.lastPos.p,
            panel = dd.panel,
            dropEvent = this.createEvent(dd, e, data, col, c, pos !== false ? pos : c.items.getCount());

        Ext.suspendLayouts();

        if (this.portal.fireEvent('validatedrop', dropEvent) !== false && this.portal.fireEvent('beforedrop', dropEvent) !== false) {

            // make sure panel is visible prior to inserting so that the layout doesn't ignore it
            panel.el.dom.style.display = '';

            if (pos !== false) {
                c.insert(pos, panel);
            } else {
                c.add(panel);
            }

            dd.proxy.hide();
            this.portal.fireEvent('drop', dropEvent);

            // scroll position is lost on drop, fix it
            var st = this.scrollPos.top;

            if (st) {
                var d = this.portal.body.dom;
                setTimeout(function() {
                    d.scrollTop = st;
                },
                10);
            }

        }
        
        Ext.resumeLayouts(true);

        delete this.lastPos;
        return true;
    },

    // internal cache of body and column coords
    getGrid : function () {
        var box = this.portal.body.getBox();
        box.columnX = [];
        this.portal.items.each(function (c) {
            box.columnX.push({
                x: c.el.getX(),
                w: c.el.getWidth()
            });
        });

        return box;
    },

    // unregister the dropzone from ScrollManager
    unreg : function () {
        Ext.dd.ScrollManager.unregister(this.portal.body);
        Ext.app.PortalDropZone.superclass.unreg.call(this);
    }
});


Ext.define('Ext.calendar.util.Date', {
    
    singleton: true,
	
	equalDates : function(dt1, dt2){
		return dt1.getFullYear() == dt2.getFullYear() && dt1.getMonth() == dt2.getMonth() && dt1.getDate() == dt2.getDate();
	},
    
    diffDays: function(start, end) {
        var day = 1000 * 60 * 60 * 24,
            clear = Ext.Date.clearTime,
            diff = clear(end, true).getTime() - clear(start, true).getTime();
        
        return Math.ceil(diff / day);
    },

    copyTime: function(fromDt, toDt) {
        var dt = Ext.Date.clone(toDt);
        dt.setHours(
            fromDt.getHours(),
            fromDt.getMinutes(),
            fromDt.getSeconds(),
            fromDt.getMilliseconds());

        return dt;
    },

    compare: function(dt1, dt2, precise) {
        if (precise !== true) {
            dt1 = Ext.Date.clone(dt1);
            dt1.setMilliseconds(0);
            dt2 = Ext.Date.clone(dt2);
            dt2.setMilliseconds(0);
        }
        return dt2.getTime() - dt1.getTime();
    },

    isMidnight: function(dt) {
        return dt.getHours() === 0 &&
               dt.getMinutes() === 0 &&
               dt.getSeconds() === 0 && 
               dt.getMilliseconds() === 0;    
    },

    // private helper fn
    maxOrMin: function(max) {
        var dt = (max ? 0: Number.MAX_VALUE),
        i = 0,
        args = arguments[1],
        ln = args.length;
        for (; i < ln; i++) {
            dt = Math[max ? 'max': 'min'](dt, args[i].getTime());
        }
        return new Date(dt);
    },

    max: function() {
        return this.maxOrMin.apply(this, [true, arguments]);
    },

    min: function() {
        return this.maxOrMin.apply(this, [false, arguments]);
    },
    
    today: function() {
        return Ext.Date.clearTime(new Date());
    },
    
    
    add : function(dt, o) {
        if (!o) {
            return dt;
        }
        var ExtDate = Ext.Date,
            dateAdd = ExtDate.add,
            newDt = ExtDate.clone(dt);
        
        if (o.years) {
            newDt = dateAdd(newDt, ExtDate.YEAR, o.years);
        }
        if (o.months) {
            newDt = dateAdd(newDt, ExtDate.MONTH, o.months);
        }
        if (o.weeks) {
            o.days = (o.days || 0) + (o.weeks * 7);
        }
        if (o.days) {
            newDt = dateAdd(newDt, ExtDate.DAY, o.days);
        }
        if (o.hours) {
            newDt = dateAdd(newDt, ExtDate.HOUR, o.hours);
        }
        if (o.minutes) {
            newDt = dateAdd(newDt, ExtDate.MINUTE, o.minutes);
        }
        if (o.seconds) {
            newDt = dateAdd(newDt, ExtDate.SECOND, o.seconds);
        }
        if (o.millis) {
            newDt = dateAdd(newDt, ExtDate.MILLI, o.millis);
        }
         
        return o.clearTime ? ExtDate.clearTime(newDt) : newDt;
    }
});

Ext.define('Ext.calendar.util.WeekEventRenderer', {
    
    requires: ['Ext.core.DomHelper'],
    
    statics: {
        // private
        getEventRow: function(id, week, index) {
            var indexOffset = 1,
                //skip row with date #'s
                evtRow,
                wkRow = Ext.get(id + '-wk-' + week);
            if (wkRow) {
                var table = wkRow.child('.ext-cal-evt-tbl', true);
                evtRow = table.tBodies[0].childNodes[index + indexOffset];
                if (!evtRow) {
                    evtRow = Ext.core.DomHelper.append(table.tBodies[0], '<tr></tr>');
                }
            }
            return Ext.get(evtRow);
        },

        render: function(o) {
            var w = 0,
                grid = o.eventGrid,
                dt = Ext.Date.clone(o.viewStart),
                eventTpl = o.tpl,
                max = o.maxEventsPerDay != undefined ? o.maxEventsPerDay: 999,
                weekCount = o.weekCount < 1 ? 6: o.weekCount,
                dayCount = o.weekCount == 1 ? o.dayCount: 7,
                cellCfg;
			dt.setHours(1);
            for (; w < weekCount; w++) {
                if (!grid[w] || grid[w].length == 0) {
                    // no events or span cells for the entire week
                    if (weekCount == 1) {
                        row = this.getEventRow(o.id, w, 0);
                        cellCfg = {
                            tag: 'td',
                            cls: 'ext-cal-ev',
                            id: o.id + '-empty-0-day-' + Ext.Date.format(dt, 'Ymd'),
                            html: '&nbsp;'
                        };
                        if (dayCount > 1) {
                            cellCfg.colspan = dayCount;
                        }
                        Ext.core.DomHelper.append(row, cellCfg);
                    }
                    dt = Ext.calendar.util.Date.add(dt, {days: 7});
                } else {
                    var row,
                        d = 0,
                        wk = grid[w],
                        startOfWeek = Ext.Date.clone(dt),
                        endOfWeek = Ext.calendar.util.Date.add(startOfWeek, {days: dayCount, millis: -1});

                    for (; d < dayCount; d++) {
                        if (wk[d]) {
                            var ev = 0,
                                emptyCells = 0,
                                skipped = 0,
                                day = wk[d],
                                ct = day.length,
                                evt;

                            for (; ev < ct; ev++) {
                                if (!day[ev]) {
                                    emptyCells++;
                                    continue;
                                }
                                if (emptyCells > 0 && ev - emptyCells < max) {
                                    row = this.getEventRow(o.id, w, ev - emptyCells);
                                    cellCfg = {
                                        tag: 'td',
                                        cls: 'ext-cal-ev',
                                        id: o.id + '-empty-' + ct + '-day-' + Ext.Date.format(dt, 'Ymd')
                                    };
                                    if (emptyCells > 1 && max - ev > emptyCells) {
                                        cellCfg.rowspan = Math.min(emptyCells, max - ev);
                                    }
                                    Ext.core.DomHelper.append(row, cellCfg);
                                    emptyCells = 0;
                                }

                                if (ev >= max) {
                                    skipped++;
                                    continue;
                                }
                                evt = day[ev];

                                if (!evt.isSpan || evt.isSpanStart) {
                                    //skip non-starting span cells
                                    var item = evt.data || evt.event.data;
                                    item._weekIndex = w;
                                    item._renderAsAllDay = item[Ext.calendar.data.EventMappings.IsAllDay.name] || evt.isSpanStart;
                                    item.spanLeft = item[Ext.calendar.data.EventMappings.StartDate.name].getTime() < startOfWeek.getTime();
                                    item.spanRight = item[Ext.calendar.data.EventMappings.EndDate.name].getTime() > endOfWeek.getTime();
                                    item.spanCls = (item.spanLeft ? (item.spanRight ? 'ext-cal-ev-spanboth':
                                    'ext-cal-ev-spanleft') : (item.spanRight ? 'ext-cal-ev-spanright': ''));

                                    row = this.getEventRow(o.id, w, ev);
                                    cellCfg = {
                                        tag: 'td',
                                        cls: 'ext-cal-ev',
                                        cn: eventTpl.apply(o.templateDataFn(item))
                                    };
                                    var diff = Ext.calendar.util.Date.diffDays(dt, item[Ext.calendar.data.EventMappings.EndDate.name]) + 1,
                                        cspan = Math.min(diff, dayCount - d);

                                    if (cspan > 1) {
                                        cellCfg.colspan = cspan;
                                    }
                                    Ext.core.DomHelper.append(row, cellCfg);
                                }
                            }
                            if (ev > max) {
                                row = this.getEventRow(o.id, w, max);
                                Ext.core.DomHelper.append(row, {
                                    tag: 'td',
                                    cls: 'ext-cal-ev-more',
                                    id: 'ext-cal-ev-more-' + Ext.Date.format(dt, 'Ymd'),
                                    cn: {
                                        tag: 'a',
                                        html: Ext.String.format(o.moreText, skipped)
                                    }
                                });
                            }
                            if (ct < o.evtMaxCount[w]) {
                                row = this.getEventRow(o.id, w, ct);
                                if (row) {
                                    cellCfg = {
                                        tag: 'td',
                                        cls: 'ext-cal-ev',
                                        id: o.id + '-empty-' + (ct + 1) + '-day-' + Ext.Date.format(dt, 'Ymd')
                                    };
                                    var rowspan = o.evtMaxCount[w] - ct;
                                    if (rowspan > 1) {
                                        cellCfg.rowspan = rowspan;
                                    }
                                    Ext.core.DomHelper.append(row, cellCfg);
                                }
                            }
                        } else {
                            row = this.getEventRow(o.id, w, 0);
                            if (row) {
                                cellCfg = {
                                    tag: 'td',
                                    cls: 'ext-cal-ev',
                                    id: o.id + '-empty-day-' + Ext.Date.format(dt, 'Ymd')
                                };
                                if (o.evtMaxCount[w] > 1) {
                                    cellCfg.rowSpan = o.evtMaxCount[w];
                                }
                                Ext.core.DomHelper.append(row, cellCfg);
                            }
                        }
                        dt = Ext.calendar.util.Date.add(dt, {days: 1});
                    }
                }
            }
        }
    }
});

Ext.ns('Ext.calendar.data');

Ext.calendar.data.CalendarMappings = {
    CalendarId: {
        name:    'CalendarId',
        mapping: 'id',
        type:    'int'
    },
    Title: {
        name:    'Title',
        mapping: 'title',
        type:    'string'
    },
    Description: {
        name:    'Description', 
        mapping: 'desc',   
        type:    'string' 
    },
    ColorId: {
        name:    'ColorId',
        mapping: 'color',
        type:    'int'
    },
    IsHidden: {
        name:    'IsHidden',
        mapping: 'hidden',
        type:    'boolean'
    }
};
Ext.define('Ext.calendar.data.CalendarModel', {
    extend: 'Ext.data.Model',
    
    requires: [
        'Ext.util.MixedCollection',
        'Ext.calendar.data.CalendarMappings'
    ],
    
    statics: {
        
        reconfigure: function(){
            var Data = Ext.calendar.data,
                Mappings = Data.CalendarMappings,
                proto = Data.CalendarModel.prototype,
                fields = [];
            
            // It is critical that the id property mapping is updated in case it changed, since it
            // is used elsewhere in the data package to match records on CRUD actions:
            proto.idProperty = Mappings.CalendarId.name || 'id';
            
            for(prop in Mappings){
                if(Mappings.hasOwnProperty(prop)){
                    fields.push(Mappings[prop]);
                }
            }
            proto.fields.clear();
            for(var i = 0, len = fields.length; i < len; i++){
                proto.fields.add(Ext.create('Ext.data.Field', fields[i]));
            }
            return Data.CalendarModel;
        }
    }
},
function() {
    Ext.calendar.data.CalendarModel.reconfigure();
});

Ext.ns('Ext.calendar.data');

Ext.calendar.data.EventMappings = {
    EventId: {
        name: 'EventId',
        mapping: 'id',
        type: 'int'
    },
    CalendarId: {
        name: 'CalendarId',
        mapping: 'cid',
        type: 'int'
    },
    Title: {
        name: 'Title',
        mapping: 'title',
        type: 'string'
    },
    StartDate: {
        name: 'StartDate',
        mapping: 'start',
        type: 'date',
        dateFormat: 'c'
    },
    EndDate: {
        name: 'EndDate',
        mapping: 'end',
        type: 'date',
        dateFormat: 'c'
    },
    Location: {
        name: 'Location',
        mapping: 'loc',
        type: 'string'
    },
    Notes: {
        name: 'Notes',
        mapping: 'notes',
        type: 'string'
    },
    Url: {
        name: 'Url',
        mapping: 'url',
        type: 'string'
    },
    IsAllDay: {
        name: 'IsAllDay',
        mapping: 'ad',
        type: 'boolean'
    },
    Reminder: {
        name: 'Reminder',
        mapping: 'rem',
        type: 'string'
    },
    IsNew: {
        name: 'IsNew',
        mapping: 'n',
        type: 'boolean'
    }
};


Ext.define('Ext.calendar.data.EventModel', {
    extend: 'Ext.data.Model',
    
    requires: [
        'Ext.util.MixedCollection',
        'Ext.calendar.data.EventMappings'
    ],
    
    statics: {
        
        reconfigure: function() {
            var Data = Ext.calendar.data,
                Mappings = Data.EventMappings,
                proto = Data.EventModel.prototype,
                fields = [];
            
            // It is critical that the id property mapping is updated in case it changed, since it
            // is used elsewhere in the data package to match records on CRUD actions:
            proto.idProperty = Mappings.EventId.name || 'id';
            
            for(prop in Mappings){
                if(Mappings.hasOwnProperty(prop)){
                    fields.push(Mappings[prop]);
                }
            }
            proto.fields.clear();
            for(var i = 0, len = fields.length; i < len; i++){
                proto.fields.add(Ext.create('Ext.data.Field', fields[i]));
            }
            return Data.EventModel;
        }
    }
},
function(){
    Ext.calendar.data.EventModel.reconfigure();
});

Ext.define('Ext.calendar.data.MemoryCalendarStore', {
    extend: 'Ext.data.Store',
    model: 'Ext.calendar.data.CalendarModel',
    
    requires: [
        'Ext.data.proxy.Memory',
        'Ext.data.reader.Json',
        'Ext.data.writer.Json',
        'Ext.calendar.data.CalendarModel',
        'Ext.calendar.data.CalendarMappings'
    ],
    
    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            root: 'calendars'
        },
        writer: {
            type: 'json'
        }
    },

    autoLoad: true,
    
    initComponent: function() {
        var me = this,
            calendarData = Ext.calendar.data;
            
        me.sorters = me.sorters || [{
            property: calendarData.CalendarMappings.Title.name,
            direction: 'ASC'
        }];
        
        me.idProperty = me.idProperty || calendarData.CalendarMappings.CalendarId.name || 'id';
        
        me.fields = calendarData.CalendarModel.prototype.fields.getRange();
        
        me.callParent(arguments);
    }
});

Ext.define('Ext.calendar.data.MemoryEventStore', {
    extend: 'Ext.data.Store',
    model: 'Ext.calendar.data.EventModel',
    
    requires: [
        'Ext.data.proxy.Memory',
        'Ext.data.reader.Json',
        'Ext.data.writer.Json',
        'Ext.calendar.data.EventModel',
        'Ext.calendar.data.EventMappings'
    ],
    
    proxy: {
        type: 'memory',
        reader: {
            type: 'json',
            root: 'evts'
        },
        writer: {
            type: 'json'
        }
    },
    
    // private
    constructor: function(config){
        this.callParent(arguments);
        
        this.sorters = this.sorters || [{
            property: Ext.calendar.data.EventMappings.StartDate.name,
            direction: 'ASC'
        }];
        
        this.idProperty = this.idProperty || Ext.calendar.data.EventMappings.EventId.mapping || 'id';
        this.fields = Ext.calendar.data.EventModel.prototype.fields.getRange();
        this.onCreateRecords = Ext.Function.createInterceptor(this.onCreateRecords, this.interceptCreateRecords);
        this.initRecs();
    },
    
    // private - override to make sure that any records added in-memory
    // still get a unique PK assigned at the data level
    interceptCreateRecords: function(records, operation, success) {
        if (success) {
            var i = 0,
                rec,
                len = records.length;
            
            for (; i < len; i++) {
                records[i].data[Ext.calendar.data.EventMappings.EventId.name] = records[i].id;
            }
        }
    },
    
    // If the store started with preloaded inline data, we have to make sure the records are set up
    // properly as valid "saved" records otherwise they may get "added" on initial edit.
    initRecs: function(){
        this.each(function(rec){
            rec.store = this;
            rec.phantom = false;
        }, this);
    },
    
    // private - override the default logic for memory storage
    onProxyLoad: function(operation) {
        var me = this,
            records;
        
        if (me.data && me.data.length > 0) {
            // this store has already been initially loaded, so do not reload
            // and lose updates to the store, just use store's latest data
            me.totalCount = me.data.length;
            records = me.data.items;
        }
        else {
            // this is the initial load, so defer to the proxy's result
            var resultSet = operation.getResultSet(),
                successful = operation.wasSuccessful();

            records = operation.getRecords();

            if (resultSet) {
                me.totalCount = resultSet.total;
            }
            if (successful) {
                me.loadRecords(records, operation);
            }
        }

        me.loading = false;
        me.fireEvent('load', me, records, successful);
    }
});
Ext.define('Ext.calendar.data.EventStore', {
    extend: 'Ext.data.Store',
    model: 'Ext.calendar.data.EventModel',
    
    constructor: function(config){        
        this.deferLoad = config.autoLoad;
        config.autoLoad = false;        
        this.callParent(arguments);
    },
    
    load : function(o){
        o = o || {};
        
        if(o.params){
            delete this.initialParams;
        }
        
        if(this.initialParams){
            o.params = o.params || {};
            Ext.apply(o.params, this.initialParams);
            delete this.initialParams;
        }
        
        this.callParent(arguments);
    }
});

Ext.define('Ext.calendar.dd.StatusProxy', {
    
    extend: 'Ext.dd.StatusProxy',

    animRepair: true,
    
    
    moveEventCls : 'ext-cal-dd-move',
    
    
    addEventCls : 'ext-cal-dd-add',
    
    // inherit docs
    childEls: [
        'ghost',
        'message'
    ],
    
    // inherit docs
    renderTpl: [
        '<div class="' + Ext.baseCSSPrefix + 'dd-drop-icon"></div>' +
        '<div class="ext-dd-ghost-ct">' +
            '<div id="{id}-ghost" class="' + Ext.baseCSSPrefix + 'dd-drag-ghost"></div>' +
            '<div id="{id}-message" class="' + Ext.baseCSSPrefix + 'dd-msg"></div>' +
        '</div>'
    ],

    // inherit docs
    update : function(html){
        this.callParent(arguments);
        
        var el = this.ghost.dom.firstChild;
        if(el){
            // if the ghost contains an event clone (from dragging an existing event)
            // set it to auto height to ensure visual consistency
            Ext.fly(el).setHeight('auto');
        }
    },
    
    
    updateMsg : function(msg){
        this.message.update(msg);
    }
});

Ext.define('Ext.calendar.dd.DragZone', {
    extend: 'Ext.dd.DragZone',

    requires: [
        'Ext.calendar.dd.StatusProxy',
        'Ext.calendar.data.EventMappings'
    ],
    
    ddGroup: 'CalendarDD',
    eventSelector: '.ext-cal-evt',

    constructor: function(el, config) {
        if (!Ext.calendar._statusProxyInstance) {
            Ext.calendar._statusProxyInstance = new Ext.calendar.dd.StatusProxy();
        }
        this.proxy = Ext.calendar._statusProxyInstance;
        this.callParent(arguments);
    },

    getDragData: function(e) {
        // Check whether we are dragging on an event first
        var t = e.getTarget(this.eventSelector, 3);
        if (t) {
            var rec = this.view.getEventRecordFromEl(t);
            return {
                type: 'eventdrag',
                ddel: t,
                eventStart: rec.data[Ext.calendar.data.EventMappings.StartDate.name],
                eventEnd: rec.data[Ext.calendar.data.EventMappings.EndDate.name],
                proxy: this.proxy
            };
        }

        // If not dragging an event then we are dragging on
        // the calendar to add a new event
        t = this.view.getDayAt(e.getPageX(), e.getPageY());
        if (t.el) {
            return {
                type: 'caldrag',
                start: t.date,
                proxy: this.proxy
            };
        }
        return null;
    },

    onInitDrag: function(x, y) {
        if (this.dragData.ddel) {
            var ghost = this.dragData.ddel.cloneNode(true),
            child = Ext.fly(ghost).down('dl');

            Ext.fly(ghost).setWidth('auto');

            if (child) {
                // for IE/Opera
                child.setHeight('auto');
            }
            this.proxy.update(ghost);
            this.onStartDrag(x, y);
        }
        else if (this.dragData.start) {
            this.onStartDrag(x, y);
        }
        this.view.onInitDrag();
        return true;
    },

    afterRepair: function() {
        if (Ext.enableFx && this.dragData.ddel) {
            Ext.fly(this.dragData.ddel).highlight(this.hlColor || 'c3daf9');
        }
        this.dragging = false;
    },

    getRepairXY: function(e) {
        if (this.dragData.ddel) {
            return Ext.fly(this.dragData.ddel).getXY();
        }
    },

    afterInvalidDrop: function(e, id) {
        Ext.select('.ext-dd-shim').hide();
    }
});

Ext.define('Ext.calendar.dd.DropZone', {
    extend: 'Ext.dd.DropZone',
    
    requires: [
        'Ext.Layer',
        'Ext.calendar.data.EventMappings'
    ],

    ddGroup: 'CalendarDD',
    eventSelector: '.ext-cal-evt',

    // private
    shims: [],

    getTargetFromEvent: function(e) {
        var dragOffset = this.dragOffset || 0,
        y = e.getPageY() - dragOffset,
        d = this.view.getDayAt(e.getPageX(), y);

        return d.el ? d: null;
    },

    onNodeOver: function(n, dd, e, data) {
        var D = Ext.calendar.util.Date,
        start = data.type == 'eventdrag' ? n.date: D.min(data.start, n.date),
        end = data.type == 'eventdrag' ? D.add(n.date, {days: D.diffDays(data.eventStart, data.eventEnd)}) :
        D.max(data.start, n.date);

        if (!this.dragStartDate || !this.dragEndDate || (D.diffDays(start, this.dragStartDate) != 0) || (D.diffDays(end, this.dragEndDate) != 0)) {
            this.dragStartDate = start;
            this.dragEndDate = D.add(end, {days: 1, millis: -1, clearTime: true});
            this.shim(start, end);

            var range = Ext.Date.format(start, 'n/j');
            if (D.diffDays(start, end) > 0) {
                range += '-' + Ext.Date.format(end, 'n/j');
            }
            var msg = Ext.util.Format.format(data.type == 'eventdrag' ? this.moveText: this.createText, range);
            data.proxy.updateMsg(msg);
        }
        return this.dropAllowed;
    },

    shim: function(start, end) {
        this.currWeek = -1;
        this.DDMInstance.notifyOccluded = true;
        var dt = Ext.Date.clone(start),
            i = 0,
            shim,
            box,
            D = Ext.calendar.util.Date,
            cnt = D.diffDays(dt, end) + 1;
		dt.setHours(1);
        Ext.each(this.shims,
            function(shim) {
                if (shim) {
                    shim.isActive = false;
                }
            }
        );

        while (i++<cnt) {
            var dayEl = this.view.getDayEl(dt);

            // if the date is not in the current view ignore it (this
            // can happen when an event is dragged to the end of the
            // month so that it ends outside the view)
            if (dayEl) {
                var wk = this.view.getWeekIndex(dt);
                shim = this.shims[wk];

                if (!shim) {
                    shim = this.createShim();
                    this.shims[wk] = shim;
                }
                if (wk != this.currWeek) {
                    shim.boxInfo = dayEl.getBox();
                    this.currWeek = wk;
                }
                else {
                    box = dayEl.getBox();
                    shim.boxInfo.right = box.right;
                    shim.boxInfo.width = box.right - shim.boxInfo.x;
                }
                shim.isActive = true;
            }
            dt = D.add(dt, {days: 1});
        }

        Ext.each(this.shims, function(shim) {
            if (shim) {
                if (shim.isActive) {
                    shim.show();
                    shim.setBox(shim.boxInfo);
                }
                else if (shim.isVisible()) {
                    shim.hide();
                }
            }
        });
    },

    createShim: function() {
        if (!this.shimCt) {
            this.shimCt = Ext.get('ext-dd-shim-ct');
            if (!this.shimCt) {
                this.shimCt = document.createElement('div');
                this.shimCt.id = 'ext-dd-shim-ct';
                Ext.getBody().appendChild(this.shimCt);
            }
        }
        var el = document.createElement('div');
        el.className = 'ext-dd-shim';
        this.shimCt.appendChild(el);

        return new Ext.Layer({
            shadow: false,
            useDisplay: true,
            constrain: false
        },
        el);
    },

    clearShims: function() {
        Ext.each(this.shims,
        function(shim) {
            if (shim) {
                shim.hide();
            }
        });
        this.DDMInstance.notifyOccluded = false;
    },

    onContainerOver: function(dd, e, data) {
        return this.dropAllowed;
    },

    onCalendarDragComplete: function() {
        delete this.dragStartDate;
        delete this.dragEndDate;
        this.clearShims();
    },

    onNodeDrop: function(n, dd, e, data) {
        if (n && data) {
            if (data.type == 'eventdrag') {
                var rec = this.view.getEventRecordFromEl(data.ddel),
                dt = Ext.calendar.util.Date.copyTime(rec.data[Ext.calendar.data.EventMappings.StartDate.name], n.date);

                this.view.onEventDrop(rec, dt);
                this.onCalendarDragComplete();
                return true;
            }
            if (data.type == 'caldrag') {
                this.view.onCalendarEndDrag(this.dragStartDate, this.dragEndDate,
                Ext.bind(this.onCalendarDragComplete, this));
                //shims are NOT cleared here -- they stay visible until the handling
                //code calls the onCalendarDragComplete callback which hides them.
                return true;
            }
        }
        this.onCalendarDragComplete();
        return false;
    },

    onContainerDrop: function(dd, e, data) {
        this.onCalendarDragComplete();
        return false;
    }
});


Ext.define('Ext.calendar.dd.DayDragZone', {
    extend: 'Ext.calendar.dd.DragZone',
    
    ddGroup: 'DayViewDD',
    resizeSelector: '.ext-evt-rsz',

    getDragData: function(e) {
        var t = e.getTarget(this.resizeSelector, 2, true),
            p,
            rec;
        if (t) {
            p = t.parent(this.eventSelector);
            rec = this.view.getEventRecordFromEl(p);

            return {
                type: 'eventresize',
                ddel: p.dom,
                eventStart: rec.data[Ext.calendar.data.EventMappings.StartDate.name],
                eventEnd: rec.data[Ext.calendar.data.EventMappings.EndDate.name],
                proxy: this.proxy
            };
        }
        t = e.getTarget(this.eventSelector, 3);
        if (t) {
            rec = this.view.getEventRecordFromEl(t);
            return {
                type: 'eventdrag',
                ddel: t,
                eventStart: rec.data[Ext.calendar.data.EventMappings.StartDate.name],
                eventEnd: rec.data[Ext.calendar.data.EventMappings.EndDate.name],
                proxy: this.proxy
            };
        }

        // If not dragging/resizing an event then we are dragging on
        // the calendar to add a new event
        t = this.view.getDayAt(e.getPageX(), e.getPageY());
        if (t.el) {
            return {
                type: 'caldrag',
                dayInfo: t,
                proxy: this.proxy
            };
        }
        return null;
    }
});

Ext.define('Ext.calendar.dd.DayDropZone', {
    extend: 'Ext.calendar.dd.DropZone',

    ddGroup: 'DayViewDD',

    onNodeOver: function(n, dd, e, data) {
        var dt,
            box,
            endDt,
            text = this.createText,
            curr,
            start,
            end,
            evtEl,
            dayCol;
        if (data.type == 'caldrag') {
            if (!this.dragStartMarker) {
                // Since the container can scroll, this gets a little tricky.
                // There is no el in the DOM that we can measure by default since
                // the box is simply calculated from the original drag start (as opposed
                // to dragging or resizing the event where the orig event box is present).
                // To work around this we add a placeholder el into the DOM and give it
                // the original starting time's box so that we can grab its updated
                // box measurements as the underlying container scrolls up or down.
                // This placeholder is removed in onNodeDrop.
                this.dragStartMarker = n.el.parent().createChild({
                    style: 'position:absolute;'
                });
                this.dragStartMarker.setBox(n.timeBox);
                this.dragCreateDt = n.date;
            }
            box = this.dragStartMarker.getBox();
            box.height = Math.ceil(Math.abs(e.xy[1] - box.y) / n.timeBox.height) * n.timeBox.height;

            if (e.xy[1] < box.y) {
                box.height += n.timeBox.height;
                box.y = box.y - box.height + n.timeBox.height;
                endDt = Ext.Date.add(this.dragCreateDt, Ext.Date.MINUTE, 30);
            }
            else {
                n.date = Ext.Date.add(n.date, Ext.Date.MINUTE, 30);
            }
            this.shim(this.dragCreateDt, box);

            curr = Ext.calendar.util.Date.copyTime(n.date, this.dragCreateDt);
            this.dragStartDate = Ext.calendar.util.Date.min(this.dragCreateDt, curr);
            this.dragEndDate = endDt || Ext.calendar.util.Date.max(this.dragCreateDt, curr);

            dt = Ext.Date.format(this.dragStartDate, 'g:ia-') + Ext.Date.format(this.dragEndDate, 'g:ia');
        }
        else {
            evtEl = Ext.get(data.ddel);
            dayCol = evtEl.parent().parent();
            box = evtEl.getBox();

            box.width = dayCol.getWidth();

            if (data.type == 'eventdrag') {
                if (this.dragOffset === undefined) {
                    this.dragOffset = n.timeBox.y - box.y;
                    box.y = n.timeBox.y - this.dragOffset;
                }
                else {
                    box.y = n.timeBox.y;
                }
                dt = Ext.Date.format(n.date, 'n/j g:ia');
                box.x = n.el.getX();

                this.shim(n.date, box);
                text = this.moveText;
            }
            if (data.type == 'eventresize') {
                if (!this.resizeDt) {
                    this.resizeDt = n.date;
                }
                box.x = dayCol.getX();
                box.height = Math.ceil(Math.abs(e.xy[1] - box.y) / n.timeBox.height) * n.timeBox.height;
                if (e.xy[1] < box.y) {
                    box.y -= box.height;
                }
                else {
                    n.date = Ext.Date.add(n.date, Ext.Date.MINUTE, 30);
                }
                this.shim(this.resizeDt, box);

                curr = Ext.calendar.util.Date.copyTime(n.date, this.resizeDt);
                start = Ext.calendar.util.Date.min(data.eventStart, curr);
                end = Ext.calendar.util.Date.max(data.eventStart, curr);

                data.resizeDates = {
                    StartDate: start,
                    EndDate: end
                };
                dt = Ext.Date.format(start, 'g:ia-') + Ext.Date.format(end, 'g:ia');
                text = this.resizeText;
            }
        }

        data.proxy.updateMsg(Ext.util.Format.format(text, dt));
        return this.dropAllowed;
    },

    shim: function(dt, box) {
        Ext.each(this.shims,
            function(shim) {
                if (shim) {
                    shim.isActive = false;
                    shim.hide();
                }
            }
        );

        var shim = this.shims[0];
        if (!shim) {
            shim = this.createShim();
            this.shims[0] = shim;
        }

        shim.isActive = true;
        shim.show();
        shim.setBox(box);
        this.DDMInstance.notifyOccluded = true;
    },

    onNodeDrop: function(n, dd, e, data) {
        var rec;
        if (n && data) {
            if (data.type == 'eventdrag') {
                rec = this.view.getEventRecordFromEl(data.ddel);
                this.view.onEventDrop(rec, n.date);
                this.onCalendarDragComplete();
                delete this.dragOffset;
                return true;
            }
            if (data.type == 'eventresize') {
                rec = this.view.getEventRecordFromEl(data.ddel);
                this.view.onEventResize(rec, data.resizeDates);
                this.onCalendarDragComplete();
                delete this.resizeDt;
                return true;
            }
            if (data.type == 'caldrag') {
                Ext.destroy(this.dragStartMarker);
                delete this.dragStartMarker;
                delete this.dragCreateDt;
                this.view.onCalendarEndDrag(this.dragStartDate, this.dragEndDate,
                Ext.bind(this.onCalendarDragComplete, this));
                //shims are NOT cleared here -- they stay visible until the handling
                //code calls the onCalendarDragComplete callback which hides them.
                return true;
            }
        }
        this.onCalendarDragComplete();
        return false;
    }
});


Ext.define('Ext.calendar.form.field.CalendarCombo', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.calendarpicker',

    fieldLabel: 'Calendar',
    triggerAction: 'all',
    queryMode: 'local',
    forceSelection: true,
    selectOnFocus: true,
    
    // private
    defaultCls: 'ext-color-default',

    // private
    initComponent: function(){
        this.valueField = Ext.calendar.data.CalendarMappings.CalendarId.name;
        this.displayField = Ext.calendar.data.CalendarMappings.Title.name;
    
        this.listConfig = Ext.apply(this.listConfig || {}, {
            getInnerTpl: this.getListItemTpl
        });
        
        this.callParent(arguments);
    },
    
    // private
    getListItemTpl: function(displayField) {
        return '<div class="x-combo-list-item ext-color-{' + Ext.calendar.data.CalendarMappings.CalendarId.name +
                '}"><div class="ext-cal-picker-icon">&#160;</div>{' + displayField + '}</div>';
    },
    
    // private
    afterRender: function(){
        this.callParent(arguments);
        
        this.wrap = this.el.down('.x-form-item-body');
        this.wrap.addCls('ext-calendar-picker');
		
		this.bodyEl.setStyle({
            "position" : "relative",
            "display" : "block"
        });
        
        this.icon = Ext.core.DomHelper.append(this.bodyEl, {
            tag: 'div',            
            style : "position:relative;margin:0px;padding:0px;border:0px;float:left;",
            children:[{
                tag   : "div", 
				style: "margin-top:-21px;",
                cls: 'ext-cal-picker-icon ext-cal-picker-mainicon'                
            }]
        });
    },
    
    
    getStyleClass: function(value){
        var val = value;
        
        if (!Ext.isEmpty(val)) {
            if (Ext.isArray(val)) {
                val = val[0];
            }
            return 'ext-color-' + (val.data ? val.data[Ext.calendar.data.CalendarMappings.CalendarId.name] : val); 
        }
        return '';
    },
    
    // inherited docs
    setValue: function(value) {
        if (!value && this.store.getCount() > 0) {
            // ensure that a valid value is always set if possible
            value = this.store.getAt(0).data[Ext.calendar.data.CalendarMappings.CalendarId.name];
        }
        
        if (this.wrap && value) {
            var currentClass = this.getStyleClass(this.getValue()),
                newClass = this.getStyleClass(value);
            
            this.wrap.replaceCls(currentClass, newClass);
        }
        
        this.callParent(arguments);
    }
});

Ext.define('Ext.calendar.form.field.DateRange', {
    extend: 'Ext.form.FieldContainer',
    alias: 'widget.daterangefield',
    
    requires: [
        'Ext.form.field.Date',
        'Ext.form.field.Time',
        'Ext.form.Label',
        'Ext.form.field.Checkbox',
        'Ext.layout.container.Column'
    ],
    
    
    toText: 'to',
    
    allDayText: 'All day',
    
    singleLine: true,
    
    dateFormat: 'n/j/Y',
    
    timeFormat: Ext.Date.use24HourTime ? 'G:i' : 'g:i A',
    
    // private
    fieldLayout: {
        type: 'hbox',
        defaultMargins: { top: 0, right: 5, bottom: 0, left: 0 }
    },
    
    // private
    initComponent: function() {
        var me = this;
        
        me.addCls('ext-dt-range');
        
        if (me.singleLine) {
            me.layout = me.fieldLayout;
            me.items = me.getFieldConfigs();
        }
        else {
            me.items = [{
                xtype: 'container',
                layout: me.fieldLayout,
                items: [
                    me.getStartDateConfig(),
                    me.getStartTimeConfig(),
                    me.getDateSeparatorConfig()
                ]
            },{
                xtype: 'container',
                layout: me.fieldLayout,
                items: [
                    me.getEndDateConfig(),
                    me.getEndTimeConfig(),
                    me.getAllDayConfig()
                ]
            }];
        }
        
        me.callParent(arguments);
        me.initRefs();
    },
    
    initRefs: function() {
        var me = this;
        me.startDate = me.down('#' + me.id + '-start-date');
        me.startTime = me.down('#' + me.id + '-start-time');
        me.endTime = me.down('#' + me.id + '-end-time');
        me.endDate = me.down('#' + me.id + '-end-date');
        me.allDay = me.down('#' + me.id + '-allday');
        me.toLabel = me.down('#' + me.id + '-to-label');

        me.startDate.validateOnChange = me.endDate.validateOnChange = false;

        me.startDate.isValid = me.endDate.isValid = function() {
                                    var me = this,
                                        valid = Ext.isDate(me.getValue());
                                    if (!valid) {
                                        me.focus();
                                    }
                                    return valid;
                                 };
    },
    
    getFieldConfigs: function() {
        var me = this;
        return [
            me.getStartDateConfig(),
            me.getStartTimeConfig(),
            me.getDateSeparatorConfig(),
            me.getEndTimeConfig(),
            me.getEndDateConfig(),
            me.getAllDayConfig()
        ];
    },
    
    getStartDateConfig: function() {
        return {
            xtype: 'datefield',
            itemId: this.id + '-start-date',
            format: this.dateFormat,
            width: 100,
            listeners: {
                'change': {
                    fn: function(){
                        this.onFieldChange('date', 'start');
                    },
                    scope: this
                }
            }
        };
    },
    
    getStartTimeConfig: function() {
        return {
            xtype: 'timefield',
            itemId: this.id + '-start-time',
            hidden: this.showTimes === false,
            labelWidth: 0,
            hideLabel: true,
            width: 90,
            format: this.timeFormat,
            listeners: {
                'select': {
                    fn: function(){
                        this.onFieldChange('time', 'start');
                    },
                    scope: this
                }
            }
        };
    },
    
    getEndDateConfig: function() {
        return {
            xtype: 'datefield',
            itemId: this.id + '-end-date',
            format: this.dateFormat,
            hideLabel: true,
            width: 100,
            listeners: {
                'change': {
                    fn: function(){
                        this.onFieldChange('date', 'end');
                    },
                    scope: this
                }
            }
        };
    },
    
    getEndTimeConfig: function() {
        return {
            xtype: 'timefield',
            itemId: this.id + '-end-time',
            hidden: this.showTimes === false,
            labelWidth: 0,
            hideLabel: true,
            width: 90,
            format: this.timeFormat,
            listeners: {
                'select': {
                    fn: function(){
                        this.onFieldChange('time', 'end');
                    },
                    scope: this
                }
            }
        };
    },

    getDuration: function() {
        var me = this,
            start = me.getDT('start'),
            end = me.getDT('end');

        return end.getTime() - start.getTime();
    },
    
    getAllDayConfig: function() {
        return {
            xtype: 'checkbox',
            itemId: this.id + '-allday',
            hidden: this.showTimes === false || this.showAllDay === false,
            boxLabel: this.allDayText,
            margins: { top: 2, right: 5, bottom: 0, left: 0 },
            handler: this.onAllDayChange,
            scope: this
        };
    },
    
    onAllDayChange: function(chk, checked) {
        this.startTime.setVisible(!checked);
        this.endTime.setVisible(!checked);
    },
    
    getDateSeparatorConfig: function() {
        return {
            xtype: 'label',
            itemId: this.id + '-to-label',
            text: this.toText,
            margins: { top: 4, right: 5, bottom: 0, left: 0 }
        };
    },
    
    isSingleLine: function() {
        var me = this;
        
        if (me.calculatedSingleLine === undefined) {
            if(me.singleLine == 'auto'){
                var ownerCtEl = me.ownerCt.getEl(),
                    w = me.ownerCt.getWidth() - ownerCtEl.getPadding('lr'),
                    el = ownerCtEl.down('.x-panel-body');
                    
                if(el){
                    w -= el.getPadding('lr');
                }
                
                el = ownerCtEl.down('.x-form-item-label')
                if(el){
                    w -= el.getWidth() - el.getPadding('lr');
                }
                me.calculatedSingleLine = w <= me.singleLineMinWidth ? false : true;
            }
            else {
                me.calculatedSingleLine = me.singleLine !== undefined ? me.singleLine : true;
            }
        }
        return me.calculatedSingleLine;
    },

    // private
    onFieldChange: function(type, startend){
        this.checkDates(type, startend);
        this.fireEvent('change', this, this.getValue());
    },
        
    // private
    checkDates: function(type, startend){
        var me = this,
            startField = me.down('#' + me.id + '-start-' + type),
            endField = me.down('#' + me.id + '-end-' + type),
            startValue = me.getDT('start'),
            endValue = me.getDT('end');

        if(startValue > endValue){
            if(startend=='start'){
                endField.setValue(startValue);
            }else{
                startField.setValue(endValue);
                me.checkDates(type, 'start');
            }
        }
        if(type=='date'){
            me.checkDates('time', startend);
        }
    },
    
    
    getValue: function(){
        var eDate = Ext.calendar.util.Date,
            start = this.getDT('start'),
            end = this.getDT('end'),
            allDay = this.allDay.getValue();
        
        if (Ext.isDate(start) && Ext.isDate(end) && start.getTime() !== end.getTime()) {
            if (!allDay && eDate.isMidnight(start) && eDate.isMidnight(end)) {
                // 12:00am -> 12:00am over n days, all day event
                allDay = true;
                end = eDate.add(end, {
                    days: -1
                });
            }
        }
        
        return [
            start, 
            end,
            allDay
        ];
    },
    
    // private getValue helper
    getDT: function(startend){
        var time = this[startend+'Time'].getValue(),
            dt = this[startend+'Date'].getValue();
            
        if(Ext.isDate(dt)){
            dt = Ext.Date.format(dt, this[startend + 'Date'].format);
        }
        else{
            return null;
        };
        if(time && time != ''){
            time = Ext.Date.format(time, this[startend+'Time'].format);
            var val = Ext.Date.parseDate(dt + ' ' + time, this[startend+'Date'].format + ' ' + this[startend+'Time'].format);
            return val;
            //return Ext.Date.parseDate(dt+' '+time, this[startend+'Date'].format+' '+this[startend+'Time'].format);
        }
        return Ext.Date.parseDate(dt, this[startend+'Date'].format);
        
    },
    
    
    setValue: function(v){
        if(!v) {
            return;
        }
        if(Ext.isArray(v)){
            this.setDT(v[0], 'start');
            this.setDT(v[1], 'end');
            this.allDay.setValue(!!v[2]);
        }
        else if(Ext.isDate(v)){
            this.setDT(v, 'start');
            this.setDT(v, 'end');
            this.allDay.setValue(false);
        }
        else if(v[Ext.calendar.data.EventMappings.StartDate.name]){ //object
            this.setDT(v[Ext.calendar.data.EventMappings.StartDate.name], 'start');
            if(!this.setDT(v[Ext.calendar.data.EventMappings.EndDate.name], 'end')){
                this.setDT(v[Ext.calendar.data.EventMappings.StartDate.name], 'end');
            }
            this.allDay.setValue(!!v[Ext.calendar.data.EventMappings.IsAllDay.name]);
        }
    },
    
    // private setValue helper
    setDT: function(dt, startend){
        if(dt && Ext.isDate(dt)){
            this[startend + 'Date'].setValue(dt);
            this[startend + 'Time'].setValue(Ext.Date.format(dt, this[startend + 'Time'].format));
            return true;
        }
    },
    
    // inherited docs
    isDirty: function(){
        var dirty = false;
        if(this.rendered && !this.disabled) {
            this.items.each(function(item){
                if (item.isDirty()) {
                    dirty = true;
                    return false;
                }
            });
        }
        return dirty;
    },
    
    // private
    onDisable : function(){
        this.delegateFn('disable');
    },
    
    // private
    onEnable : function(){
        this.delegateFn('enable');
    },
    
    // inherited docs
    reset : function(){
        this.delegateFn('reset');
    },
    
    // private
    delegateFn : function(fn){
        this.items.each(function(item){
            if (item[fn]) {
                item[fn]();
            }
        });
    },
    
    // private
    beforeDestroy: function(){
        Ext.destroy(this.fieldCt);
        this.callParent(arguments);
    },
    
    
    getRawValue : Ext.emptyFn,
    
    setRawValue : Ext.emptyFn
});

Ext.define('Ext.calendar.form.field.ReminderCombo', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.reminderfield',

    fieldLabel: 'Reminder',
    queryMode: 'local',
    triggerAction: 'all',
    forceSelection: true,
    displayField: 'desc',
    valueField: 'value',

    // private
    initComponent: function() {
        this.store = this.store || new Ext.data.ArrayStore({
            fields: ['value', 'desc'],
            idIndex: 0,
            data: [
            ['', 'None'],
            ['0', 'At start time'],
            ['5', '5 minutes before start'],
            ['15', '15 minutes before start'],
            ['30', '30 minutes before start'],
            ['60', '1 hour before start'],
            ['90', '1.5 hours before start'],
            ['120', '2 hours before start'],
            ['180', '3 hours before start'],
            ['360', '6 hours before start'],
            ['720', '12 hours before start'],
            ['1440', '1 day before start'],
            ['2880', '2 days before start'],
            ['4320', '3 days before start'],
            ['5760', '4 days before start'],
            ['7200', '5 days before start'],
            ['10080', '1 week before start'],
            ['20160', '2 weeks before start']
            ]
        });

        this.callParent();
    },

    // inherited docs
    initValue: function() {
        if (this.value !== undefined) {
            this.setValue(this.value);
        }
        else {
            this.setValue('');
        }
        this.originalValue = this.getValue();
    }
});


Ext.define('Ext.calendar.form.EventDetails', {
    extend: 'Ext.form.Panel',
    alias: 'widget.eventeditform',
    
    requires: [
        'Ext.calendar.form.field.DateRange',
        'Ext.calendar.form.field.ReminderCombo',
        'Ext.calendar.data.EventMappings',
        'Ext.calendar.form.field.CalendarCombo'
    ],
    
    fieldDefaults: {
        msgTarget: 'side',
        labelWidth: 65
    },
    title: 'Event Form',
    titleTextAdd: 'Add Event',
    titleTextEdit: 'Edit Event',
    bodyStyle: 'background:transparent;padding:20px 20px 10px;',
    border: false,
    buttonAlign: 'center',
    autoHeight: true,
    // to allow for the notes field to autogrow
    cls: 'ext-evt-edit-form',

    // private properties:
    newId: 10000,
    layout: 'column',

    // private
    initComponent: function() {

        this.addEvents({
            
            eventadd: true,
            
            eventupdate: true,
            
            eventdelete: true,
            
            eventcancel: true
        });

        this.titleField = new Ext.form.Text({
            fieldLabel : 'Title',
            name       : Ext.calendar.data.EventMappings.Title.name,
            anchor     : '90%'
        });
        this.dateRangeField = new Ext.calendar.form.field.DateRange({
            fieldLabel : 'When',
            singleLine : false,
            anchor     : '90%'
        });
        this.reminderField = new Ext.calendar.form.field.ReminderCombo({
            name   : 'Reminder',
            anchor : '70%'
        });
        this.notesField = new Ext.form.TextArea({
            fieldLabel : 'Notes',
            name       : Ext.calendar.data.EventMappings.Notes.name,
            grow       : true,
            growMax    : 150,
            anchor     : '100%'
        });
        this.locationField = new Ext.form.Text({
            fieldLabel : 'Location',
            name       : Ext.calendar.data.EventMappings.Location.name,
            anchor     : '100%'
        });
        this.urlField = new Ext.form.Text({
            fieldLabel: 'Web Link',
            name: Ext.calendar.data.EventMappings.Url.name,
            anchor: '100%'
        });

        var leftFields = [this.titleField, this.dateRangeField, this.reminderField],
        rightFields = [this.notesField, this.locationField, this.urlField];

        if (this.calendarStore) {
            this.calendarField = new Ext.calendar.form.field.CalendarCombo({
                store: this.calendarStore,
                anchor: '70%',
                name: Ext.calendar.data.EventMappings.CalendarId.name
            });
            leftFields.splice(2, 0, this.calendarField);
        };

        this.items = [{
            id: 'left-col',
            columnWidth: 0.65,
            layout: 'anchor',
            border: false,
            items: leftFields
        },
        {
            id: 'right-col',
            columnWidth: 0.35,
            layout: 'anchor',
            border: false,
            items: rightFields
        }];

        this.fbar = [{
            text: 'Save',
            scope: this,
            handler: this.onSave
        },
        {
            cls: 'ext-del-btn',
            itemId: this.id+'-del-btn',
            text: 'Delete',
            scope: this,
            handler: this.onDelete
        },
        {
            text: 'Cancel',
            scope: this,
            handler: this.onCancel
        }];

        this.callParent(arguments);
    },

    // inherited docs
    loadRecord: function(rec){
        this.form.reset().loadRecord.apply(this.form, arguments);
        this.activeRecord = rec;
        this.dateRangeField.setValue(rec.data);
        
        if(this.calendarStore){
            this.form.setValues({
                'calendar': rec.data[Ext.calendar.data.EventMappings.CalendarId.name]
            });
        }
        
        if (rec.phantom) {
            this.setTitle(this.titleTextAdd);
            this.down('#' + this.id + '-del-btn').hide();
        }
        else {
            this.setTitle(this.titleTextEdit);
            this.down('#' + this.id + '-del-btn').show();
        }
        this.titleField.focus();
    },
    
    // inherited docs
    updateRecord: function(){
        var dates = this.dateRangeField.getValue(),
            M = Ext.calendar.data.EventMappings,
            rec = this.activeRecord,
            fs = rec.fields,
            dirty = false;
            
        rec.beginEdit();
        
        //TODO: This block is copied directly from BasicForm.updateRecord.
        // Unfortunately since that method internally calls begin/endEdit all
        // updates happen and the record dirty status is reset internally to
        // that call. We need the dirty status, plus currently the DateRangeField
        // does not map directly to the record values, so for now we'll duplicate
        // the setter logic here (we need to be able to pick up any custom-added 
        // fields generically). Need to revisit this later and come up with a better solution.
        fs.each(function(f){
            var field = this.form.findField(f.name);
            if(field){
                var value = field.getValue();
                if (value.getGroupValue) {
                    value = value.getGroupValue();
                } 
                else if (field.eachItem) {
                    value = [];
                    field.eachItem(function(item){
                        value.push(item.getValue());
                    });
                }
                rec.set(f.name, value);
            }
        }, this);
        
        rec.set(M.StartDate.name, dates[0]);
        rec.set(M.EndDate.name, dates[1]);
        rec.set(M.IsAllDay.name, dates[2]);
        
        dirty = rec.dirty;
        rec.endEdit();
        
        return dirty;
    },

    setStartDate: function(d) {
        var me = this,
            duration = me.dateRangeField.getDuration();

        me.dateRangeField.setDT(d, 'start');

        // Set the end time to keep the duration the same
        me.dateRangeField.setDT(new Date(me.dateRangeField.getDT('start').getTime() + duration), 'end');
    },

    setEndDate: function(d) {
        this.dateRangeField.setDT(d, 'end');
    },

    // private
    onCancel: function() {
        this.cleanup(true);
        this.fireEvent('eventcancel', this, this.activeRecord);
    },

    // private
    cleanup: function(hide) {
        if (this.activeRecord && this.activeRecord.dirty) {
            this.activeRecord.reject();
        }
        delete this.activeRecord;

        if (this.form.isDirty()) {
            this.form.reset();
        }
    },

    // private
    onSave: function(){
        if(!this.form.isValid()){
            return;
        }
        if(!this.updateRecord()){
            this.onCancel();
            return;
        }
        this.fireEvent(this.activeRecord.phantom ? 'eventadd' : 'eventupdate', this, this.activeRecord);
    },

    // private
    onDelete: function() {
        this.fireEvent('eventdelete', this, this.activeRecord);
    }
});


Ext.define('Ext.calendar.form.EventWindow', {
    extend: 'Ext.window.Window',
    alias: 'widget.eventeditwindow',
    
    requires: [
        'Ext.form.Panel',
        'Ext.calendar.data.EventModel',
        'Ext.calendar.data.EventMappings'
    ],

    constructor: function(config) {
        var formPanelCfg = {
            xtype: 'form',
            fieldDefaults: {
                msgTarget: 'side',
                labelWidth: 65
            },
            frame: false,
            bodyStyle: 'background:transparent;padding:5px 10px 10px;',
            bodyBorder: false,
            border: false,
            items: [{
                itemId: 'title',
                name: Ext.calendar.data.EventMappings.Title.name,
                fieldLabel: 'Title',
                xtype: 'textfield',
                anchor: '100%'
            },
            {
                xtype: 'daterangefield',
                itemId: 'date-range',
                name: 'dates',
                anchor: '100%',
                fieldLabel: 'When'
            }]
        };
    
        if (config.calendarStore) {
            this.calendarStore = config.calendarStore;
            delete config.calendarStore;
    
            formPanelCfg.items.push({
                xtype: 'calendarpicker',
                itemId: 'calendar',
                name: Ext.calendar.data.EventMappings.CalendarId.name,
                anchor: '100%',
                store: this.calendarStore
            });
        }
    
        this.callParent([Ext.apply({
            titleTextAdd: 'Add Event',
            titleTextEdit: 'Edit Event',
            width: 600,
            autocreate: true,
            border: true,
            closeAction: 'hide',
            modal: false,
            resizable: false,
            buttonAlign: 'left',
            savingMessage: 'Saving changes...',
            deletingMessage: 'Deleting event...',
            layout: 'fit',
    
            fbar: [{
                xtype: 'tbtext',
                text: '<a href="#" id="tblink">Edit Details...</a>'
            },
            '->', {
                text: 'Save',
                disabled: false,
                handler: this.onSave,
                scope: this
            },
            {
                itemId: 'delete-btn',
                text: 'Delete',
                disabled: false,
                handler: this.onDelete,
                scope: this,
                hideMode: 'offsets'
            },
            {
                text: 'Cancel',
                disabled: false,
                handler: this.onCancel,
                scope: this
            }],
            items: formPanelCfg
        },
        config)]);
    },

    // private
    newId: -10000,

    // private
    initComponent: function() {
        this.callParent();

        this.formPanel = this.items.items[0];

        this.addEvents({
            
            eventadd: true,
            
            eventupdate: true,
            
            eventdelete: true,
            
            eventcancel: true,
            
            editdetails: true
        });
    },

    // private
    afterRender: function() {
        this.callParent();

        this.el.addCls('ext-cal-event-win');

        Ext.get('tblink').on('click', this.onEditDetailsClick, this);
        
        this.titleField = this.down('#title');
        this.dateRangeField = this.down('#date-range');
        this.calendarField = this.down('#calendar');
        this.deleteButton = this.down('#delete-btn');
    },
    
    // private
    onEditDetailsClick: function(e){
        e.stopEvent();
        this.updateRecord(this.activeRecord, true);
        this.fireEvent('editdetails', this, this.activeRecord, this.animateTarget);
    },

    
    show: function(o, animateTarget) {
        // Work around the CSS day cell height hack needed for initial render in IE8/strict:
        var me = this,
            anim = (Ext.isIE8 && Ext.isStrict) ? null: animateTarget,
            M = Ext.calendar.data.EventMappings;

        this.callParent([anim, function(){
            me.titleField.focus(false, 100);
        }]);
        
        this.deleteButton[o.data && o.data[M.EventId.name] ? 'show': 'hide']();

        var rec,
        f = this.formPanel.form;

        if (o.data) {
            rec = o;
            this.setTitle(rec.phantom ? this.titleTextAdd : this.titleTextEdit);
            f.loadRecord(rec);
        }
        else {
            this.setTitle(this.titleTextAdd);

            var start = o[M.StartDate.name],
                end = o[M.EndDate.name] || Ext.calendar.util.Date.add(start, {hours: 1});

            rec = Ext.create('Ext.calendar.data.EventModel');
            rec.data[M.EventId.name] = this.newId--;
			rec.data[M.StartDate.name] = start;
            rec.data[M.EndDate.name] = end;
            rec.data[M.IsAllDay.name] = !!o[M.IsAllDay.name] || start.getDate() != Ext.calendar.util.Date.add(end, {millis: 1}).getDate();

            f.reset();
            f.loadRecord(rec);
        }

        if (this.calendarStore) {
            this.calendarField.setValue(rec.data[M.CalendarId.name]);
        }
        this.dateRangeField.setValue(rec.data);
        this.activeRecord = rec;

        return this;
    },

    // private
    roundTime: function(dt, incr) {
        incr = incr || 15;
        var m = parseInt(dt.getMinutes(), 10);
        return dt.add('mi', incr - (m % incr));
    },

    // private
    onCancel: function() {
        this.cleanup(true);
        this.fireEvent('eventcancel', this);
    },

    // private
    cleanup: function(hide) {
        if (this.activeRecord && this.activeRecord.dirty) {
            this.activeRecord.reject();
        }
        delete this.activeRecord;

        if (hide === true) {
            // Work around the CSS day cell height hack needed for initial render in IE8/strict:
            //var anim = afterDelete || (Ext.isIE8 && Ext.isStrict) ? null : this.animateTarget;
            this.hide();
        }
    },

    // private
    updateRecord: function(record, keepEditing) {
        var fields = record.fields,
            values = this.formPanel.getForm().getValues(),
            name,
            M = Ext.calendar.data.EventMappings,
            obj = {};

        fields.each(function(f) {
            name = f.name;
            if (name in values) {
                obj[name] = values[name];
            }
        });
        
        var dates = this.dateRangeField.getValue();
        obj[M.StartDate.name] = dates[0];
        obj[M.EndDate.name] = dates[1];
        obj[M.IsAllDay.name] = dates[2];

        record.beginEdit();
        record.set(obj);
        
        if (!keepEditing) {
            record.endEdit();
        }

        return this;
    },
    
    // private
    onSave: function(){
        if(!this.formPanel.form.isValid()){
            return;
        }
        if(!this.updateRecord(this.activeRecord)){
            this.onCancel();
            return;
        }
        this.fireEvent(this.activeRecord.phantom ? 'eventadd' : 'eventupdate', this, this.activeRecord, this.animateTarget);

        // Clear phantom and modified states.
        this.activeRecord.commit();
    },
    
    // private
    onDelete: function(){
        this.fireEvent('eventdelete', this, this.activeRecord, this.animateTarget);
    }
});
Ext.define('Ext.calendar.template.BoxLayout', {
    extend: 'Ext.XTemplate',
    
    requires: ['Ext.Date'],
    
    constructor: function(config){
        
        Ext.apply(this, config);
    
        var weekLinkTpl = this.showWeekLinks ? '<div id="{weekLinkId}" class="ext-cal-week-link">{weekNum}</div>' : '';
        
        this.callParent([
            '<tpl for="weeks">',
                '<div id="{[this.id]}-wk-{[xindex-1]}" class="ext-cal-wk-ct" style="top:{[this.getRowTop(xindex, xcount)]}%; height:{[this.getRowHeight(xcount)]}%;">',
                    weekLinkTpl,
                    '<table class="ext-cal-bg-tbl" cellpadding="0" cellspacing="0">',
                        '<tbody>',
                            '<tr>',
                                '<tpl for=".">',
                                     '<td id="{[this.id]}-day-{date:date("Ymd")}" class="{cellCls}">&#160;</td>',
                                '</tpl>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                    '<table class="ext-cal-evt-tbl" cellpadding="0" cellspacing="0">',
                        '<tbody>',
                            '<tr>',
                                '<tpl for=".">',
                                    '<td id="{[this.id]}-ev-day-{date:date("Ymd")}" class="{titleCls}"><div>{title}</div></td>',
                                '</tpl>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
            '</tpl>', {
                getRowTop: function(i, ln){
                    return ((i-1)*(100/ln));
                },
                getRowHeight: function(ln){
                    return 100/ln;
                }
            }
        ]);
    },

    applyTemplate : function(o){
        
        Ext.apply(this, o);
        
        var w = 0, title = '', first = true, isToday = false, showMonth = false, prevMonth = false, nextMonth = false,
            weeks = [[]],
			today = Ext.calendar.util.Date.today(),
            dt = Ext.Date.clone(this.viewStart),
            thisMonth = this.startDate.getMonth();
        
        for(; w < this.weekCount || this.weekCount == -1; w++){
            if(dt > this.viewEnd){
                break;
            }
            weeks[w] = [];
            
            for(var d = 0; d < this.dayCount; d++){                
				isToday = Ext.calendar.util.Date.equalDates(dt, today);
                showMonth = first || (dt.getDate() == 1);
                prevMonth = (dt.getMonth() < thisMonth) && this.weekCount == -1;
                nextMonth = (dt.getMonth() > thisMonth) && this.weekCount == -1;
                
                if(dt.getDay() == 1){
                    // The ISO week format 'W' is relative to a Monday week start. If we
                    // make this check on Sunday the week number will be off.
                    weeks[w].weekNum = this.showWeekNumbers ? Ext.Date.format(dt, 'W') : '&#160;';
                    weeks[w].weekLinkId = 'ext-cal-week-'+Ext.Date.format(dt, 'Ymd');
                }
                
                if(showMonth){
                    if(isToday){
                        title = this.getTodayText();
                    }
                    else{
                        title = Ext.Date.format(dt, this.dayCount == 1 ? 'l, F j, Y' : (first ? 'M j, Y' : 'M j'));
                    }
                }
                else{
                    var dayFmt = (w == 0 && this.showHeader !== true) ? 'D j' : 'j';
                    title = isToday ? this.getTodayText() : Ext.Date.format(dt, dayFmt);
                }
                
                weeks[w].push({
                    title: title,
                    date: Ext.Date.clone(dt),
                    titleCls: 'ext-cal-dtitle ' + (isToday ? ' ext-cal-dtitle-today' : '') + 
                        (w==0 ? ' ext-cal-dtitle-first' : '') +
                        (prevMonth ? ' ext-cal-dtitle-prev' : '') + 
                        (nextMonth ? ' ext-cal-dtitle-next' : ''),
                    cellCls: 'ext-cal-day ' + (isToday ? ' ext-cal-day-today' : '') + 
                        (d==0 ? ' ext-cal-day-first' : '') +
                        (prevMonth ? ' ext-cal-day-prev' : '') +
                        (nextMonth ? ' ext-cal-day-next' : '')
                });                
				dt.setHours(1);
				dt = Ext.calendar.util.Date.add(dt, {hours: 26});
                first = false;
            }
        }
        
        return this.applyOut({
            weeks: weeks
        }, []).join('');
    },
    
    getTodayText : function(){
        var dt = Ext.Date.format(new Date(), 'l, F j, Y'),
            fmt,
            todayText = this.showTodayText !== false ? this.todayText : '',
            timeText = this.showTime !== false ? ' <span id="'+this.id+'-clock" class="ext-cal-dtitle-time">' + 
                    Ext.Date.format(new Date(), 'g:i a') + '</span>' : '',
            separator = todayText.length > 0 || timeText.length > 0 ? ' &mdash; ' : '';
        
        if(this.dayCount == 1){
            return dt + separator + todayText + timeText;
        }
        fmt = this.weekCount == 1 ? 'D j' : 'j';
        return todayText.length > 0 ? todayText + timeText : Ext.Date.format(new Date(), fmt) + timeText;
    }
}, 
function() {
    this.createAlias('apply', 'applyTemplate');
});

Ext.define('Ext.calendar.template.DayBody', {
    extend: 'Ext.XTemplate',
    
    constructor: function(config){
        
        Ext.apply(this, config);

        this.callParent([
            '<table class="ext-cal-bg-tbl" cellspacing="0" cellpadding="0">',
                '<tbody>',
                    '<tr height="1">',
                        '<td class="ext-cal-gutter"></td>',
                        '<td colspan="{dayCount}">',
                            '<div class="ext-cal-bg-rows">',
                                '<div class="ext-cal-bg-rows-inner">',
                                    '<tpl for="times">',
                                        '<div class="ext-cal-bg-row">',
                                            '<div class="ext-cal-bg-row-div ext-row-{[xindex]}"></div>',
                                        '</div>',
                                    '</tpl>',
                                '</div>',
                            '</div>',
                        '</td>',
                    '</tr>',
                    '<tr>',
                        '<td class="ext-cal-day-times">',
                            '<tpl for="times">',
                                '<div class="ext-cal-bg-row">',
                                    '<div class="ext-cal-day-time-inner">{.}</div>',
                                '</div>',
                            '</tpl>',
                        '</td>',
                        '<tpl for="days">',
                            '<td class="ext-cal-day-col">',
                                '<div class="ext-cal-day-col-inner">',
                                    '<div id="{[this.id]}-day-col-{.:date("Ymd")}" class="ext-cal-day-col-gutter"></div>',
                                '</div>',
                            '</td>',
                        '</tpl>',
                    '</tr>',
                '</tbody>',
            '</table>'
        ]);
    },

    // private
    applyTemplate : function(o){
        this.today = Ext.calendar.util.Date.today();
        this.dayCount = this.dayCount || 1;
        
        var i = 0,
            days = [],
            dt = Ext.Date.clone(o.viewStart),
            times = [];
            
        for(; i<this.dayCount; i++){
            days[i] = Ext.calendar.util.Date.add(dt, {days: i});
        }

        // use a fixed DST-safe date so times don't get skipped on DST boundaries
        dt = Ext.Date.clearTime(new Date('5/26/1972'));
        
        for(i=0; i<24; i++){
            times.push(Ext.Date.format(dt, 'ga'));
            dt = Ext.calendar.util.Date.add(dt, {hours: 1});
        }
        
        return this.applyOut({
            days: days,
            dayCount: days.length,
            times: times
        }, []).join('');
    },
    
    apply: function(values) {
        return this.applyTemplate.apply(this, arguments);
    }
});

Ext.define('Ext.calendar.template.DayHeader', {
    extend: 'Ext.XTemplate',
    
    requires: ['Ext.calendar.template.BoxLayout'],
    
    constructor: function(config){
        
        Ext.apply(this, config);
        
        this.allDayTpl = new Ext.calendar.template.BoxLayout(config);
        this.allDayTpl.compile();
        
        this.callParent([
            '<div class="ext-cal-hd-ct">',
                '<table class="ext-cal-hd-days-tbl" cellspacing="0" cellpadding="0">',
                    '<tbody>',
                        '<tr>',
                            '<td class="ext-cal-gutter"></td>',
                            '<td class="ext-cal-hd-days-td"><div class="ext-cal-hd-ad-inner">{allDayTpl}</div></td>',
                            '<td class="ext-cal-gutter-rt"></td>',
                        '</tr>',
                    '</tobdy>',
                '</table>',
            '</div>'
        ]);
    },

    applyTemplate : function(o){
        return this.applyOut({
            allDayTpl: this.allDayTpl.apply(o)
        }, []).join('');
    },
    
    apply: function(values) {
        return this.applyTemplate.apply(this, arguments);
    }
});

Ext.define('Ext.calendar.template.Month', {
    extend: 'Ext.XTemplate',
    
    requires: ['Ext.calendar.template.BoxLayout'],
    
    constructor: function(config){
        
        Ext.apply(this, config);
    
        this.weekTpl = new Ext.calendar.template.BoxLayout(config);
        this.weekTpl.compile();
        
        var weekLinkTpl = this.showWeekLinks ? '<div class="ext-cal-week-link-hd">&#160;</div>' : '';
        
        this.callParent([
            '<div class="ext-cal-inner-ct {extraClasses}">',
                '<div class="ext-cal-hd-ct ext-cal-month-hd">',
                    weekLinkTpl,
                    '<table class="ext-cal-hd-days-tbl" cellpadding="0" cellspacing="0">',
                        '<tbody>',
                            '<tr>',
                                '<tpl for="days">',
                                    '<th class="ext-cal-hd-day{[xindex==1 ? " ext-cal-day-first" : ""]}" title="{.:date("l, F j, Y")}">{.:date("D")}</th>',
                                '</tpl>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                '</div>',
                '<div class="ext-cal-body-ct">{weeks}</div>',
            '</div>'
        ]);
    },

    // private
    applyTemplate : function(o){
        var days = [],
            weeks = this.weekTpl.apply(o),
            dt = o.viewStart,
            D = Ext.calendar.util.Date;
        
        for(var i = 0; i < 7; i++){
            days.push(D.add(dt, {days: i}));
        }
        
        var extraClasses = this.showHeader === true ? '' : 'ext-cal-noheader';
        if(this.showWeekLinks){
            extraClasses += ' ext-cal-week-links';
        }
        
        return this.applyOut({
            days: days,
            weeks: weeks,
            extraClasses: extraClasses
        }, []).join('');
    },
    
    apply: function(values) {
        return this.applyTemplate.apply(this, arguments);
    }
});

Ext.define('Ext.calendar.view.AbstractCalendar', {
    extend: 'Ext.Component',
    alias: 'widget.calendarview',
    
    startDay: 0,
    
    spansHavePriority: false,
    
    trackMouseOver: true,
    
    enableFx: true,
    
    enableAddFx: true,
    
    enableUpdateFx: false,
    
    enableRemoveFx: true,
    
    enableDD: true,
    
    monitorResize: true,
    
    ddCreateEventText: 'Create event for {0}',
    
    ddMoveEventText: 'Move event to {0}',
    
    ddResizeEventText: 'Update event to {0}',

    //private properties -- do not override:
    weekCount: 1,
    dayCount: 1,
    eventSelector: '.ext-cal-evt',
    eventOverClass: 'ext-evt-over',
    eventElIdDelimiter: '-evt-',
    dayElIdDelimiter: '-day-',

    
    getEventBodyMarkup: Ext.emptyFn,
    // must be implemented by a subclass
    
    getEventTemplate: Ext.emptyFn,
    // must be implemented by a subclass
    // private
    initComponent: function() {
        this.setStartDate(this.startDate || new Date());

        this.callParent(arguments);

        this.addEvents({
            
            eventsrendered: true,
            
            eventclick: true,
            
            eventover: true,
            
            eventout: true,
            
            datechange: true,
            
            rangeselect: true,
            
            eventmove: true,
            
            initdrag: true,
            
            dayover: true,
            
            dayout: true
            
            //eventdelete: true
        });
    },

    // private
    afterRender: function() {
        this.callParent(arguments);

        this.renderTemplate();

        if (this.store) {
            this.setStore(this.store, true);
        }        

        this.el.on({
            'mouseover': this.onMouseOver,
            'mouseout': this.onMouseOut,
            'click': this.onClick,
            scope: this
        });

        this.el.unselectable();

        if (this.enableDD && this.readOnly !== true && this.initDD) {
            this.initDD();
        }

        this.on('eventsrendered', this.forceSize);
        Ext.defer(this.forceSize, 100, this);

    },

    // private
    forceSize: function() {
        if (this.el && this.el.down) {
            var hd = this.el.down('.ext-cal-hd-ct'),
                bd = this.el.down('.ext-cal-body-ct');
                
            if (bd==null || hd==null) {
                return;
            }
                
            var headerHeight = hd.getHeight(),
                sz = this.el.parent().getSize();
                   
            bd.setHeight(sz.height-headerHeight);
        }
    },

    refresh: function() {
        this.prepareData();
        this.renderTemplate();
        this.renderItems();
    },

    getWeekCount: function() {
        var days = Ext.calendar.util.Date.diffDays(this.viewStart, this.viewEnd);
        return Math.ceil(days / this.dayCount);
    },

    // private
    prepareData: function() {
        var lastInMonth = Ext.Date.getLastDateOfMonth(this.startDate),
        w = 0, d,
        dt = Ext.Date.clone(this.viewStart),
        weeks = this.weekCount < 1 ? 6: this.weekCount;
		
		dt.setHours(1);
		lastInMonth.setHours(1);

        this.eventGrid = [[]];
        this.allDayGrid = [[]];
        this.evtMaxCount = [];

        var evtsInView = this.store.queryBy(function(rec) {
            return this.isEventVisible(rec.data);
        },
        this);

        for (; w < weeks; w++) {
            this.evtMaxCount[w] = 0;
            if (this.weekCount == -1 && dt > lastInMonth) {
                //current week is fully in next month so skip
                break;
            }
            this.eventGrid[w] = this.eventGrid[w] || [];
            this.allDayGrid[w] = this.allDayGrid[w] || [];

            for (d = 0; d < this.dayCount; d++) {
                if (evtsInView.getCount() > 0) {
                    var evts = evtsInView.filterBy(function(rec) {
                        var startDt = Ext.Date.clearTime(rec.data[Ext.calendar.data.EventMappings.StartDate.name], true),
                            startsOnDate = Ext.calendar.util.Date.equalDates(dt, rec.data[Ext.calendar.data.EventMappings.StartDate.name]);
                            spansFromPrevView = (w == 0 && d == 0 && (dt > rec.data[Ext.calendar.data.EventMappings.StartDate.name]));
                            
                        return startsOnDate || spansFromPrevView;
                    },
                    this);

                    this.sortEventRecordsForDay(evts);
                    this.prepareEventGrid(evts, w, d);
                }
                dt = Ext.calendar.util.Date.add(dt, {days: 1});
            }
        }
        this.currentWeekCount = w;
    },

    // private
    prepareEventGrid: function(evts, w, d) {
        var me = this,
            row = 0,
            max = me.maxEventsPerDay ? me.maxEventsPerDay: 999;

        evts.each(function(evt) {
            var M = Ext.calendar.data.EventMappings,
            days = Ext.calendar.util.Date.diffDays(
            Ext.calendar.util.Date.max(me.viewStart, evt.data[M.StartDate.name]),
            Ext.calendar.util.Date.min(me.viewEnd, evt.data[M.EndDate.name])) + 1;

            if (days > 1 || Ext.calendar.util.Date.diffDays(evt.data[M.StartDate.name], evt.data[M.EndDate.name]) > 1) {
                me.prepareEventGridSpans(evt, me.eventGrid, w, d, days);
                me.prepareEventGridSpans(evt, me.allDayGrid, w, d, days, true);
            } else {
                row = me.findEmptyRowIndex(w, d);
                me.eventGrid[w][d] = me.eventGrid[w][d] || [];
                me.eventGrid[w][d][row] = evt;

                if (evt.data[M.IsAllDay.name]) {
                    row = me.findEmptyRowIndex(w, d, true);
                    me.allDayGrid[w][d] = me.allDayGrid[w][d] || [];
                    me.allDayGrid[w][d][row] = evt;
                }
            }

            if (me.evtMaxCount[w] < me.eventGrid[w][d].length) {
                me.evtMaxCount[w] = Math.min(max + 1, me.eventGrid[w][d].length);
            }
            return true;
        });
    },

    // private
    prepareEventGridSpans: function(evt, grid, w, d, days, allday) {
        // this event spans multiple days/weeks, so we have to preprocess
        // the events and store special span events as placeholders so that
        // the render routine can build the necessary TD spans correctly.
        var w1 = w,
        d1 = d,
        row = this.findEmptyRowIndex(w, d, allday),
        dt = Ext.Date.clone(this.viewStart);
		dt.setHours(1);

        var start = {
            event: evt,
            isSpan: true,
            isSpanStart: true,
            spanLeft: false,
            spanRight: (d == 6)
        };
        grid[w][d] = grid[w][d] || [];
        grid[w][d][row] = start;

        while (--days) {
            dt = Ext.calendar.util.Date.add(dt, {days: 1});
            if (dt > this.viewEnd) {
                break;
            }
            if (++d1 > 6) {
                // reset counters to the next week
                d1 = 0;
                w1++;
                row = this.findEmptyRowIndex(w1, 0);
            }
            grid[w1] = grid[w1] || [];
            grid[w1][d1] = grid[w1][d1] || [];

            grid[w1][d1][row] = {
                event: evt,
                isSpan: true,
                isSpanStart: (d1 == 0),
                spanLeft: (w1 > w) && (d1 % 7 == 0),
                spanRight: (d1 == 6) && (days > 1)
            };
        }
    },

    // private
    findEmptyRowIndex: function(w, d, allday) {
        var grid = allday ? this.allDayGrid: this.eventGrid,
        day = grid[w] ? grid[w][d] || [] : [],
        i = 0,
        ln = day.length;

        for (; i < ln; i++) {
            if (day[i] == null) {
                return i;
            }
        }
        return ln;
    },

    // private
    renderTemplate: function() {
        if (this.tpl) {
            this.tpl.overwrite(this.el, this.getParams());
            this.lastRenderStart = Ext.Date.clone(this.viewStart);
            this.lastRenderEnd = Ext.Date.clone(this.viewEnd);
        }
    },

    disableStoreEvents: function() {
        this.monitorStoreEvents = false;
    },

    enableStoreEvents: function(refresh) {
        this.monitorStoreEvents = true;
        if (refresh === true) {
            this.refresh();
        }
    },

    // private
    onResize: function() {
        this.callParent(arguments);
        this.refresh();
    },

    // private
    onInitDrag: function() {
        this.fireEvent('initdrag', this);
    },

    // private
    onEventDrop: function(rec, dt) {
        if (Ext.calendar.util.Date.compare(rec.data[Ext.calendar.data.EventMappings.StartDate.name], dt) === 0) {
            // no changes
            return;
        }
        var diff = dt.getTime() - rec.data[Ext.calendar.data.EventMappings.StartDate.name].getTime();
        rec.set(Ext.calendar.data.EventMappings.StartDate.name, dt);
        rec.set(Ext.calendar.data.EventMappings.EndDate.name, Ext.calendar.util.Date.add(rec.data[Ext.calendar.data.EventMappings.EndDate.name], {millis: diff}));

        this.fireEvent('eventmove', this, rec);
    },

    // private
    onCalendarEndDrag: function(start, end, onComplete) {
        if (start && end) {
            // set this flag for other event handlers that might conflict while we're waiting
            this.dragPending = true;

            // have to wait for the user to save or cancel before finalizing the dd interation
            var o = {};
            o[Ext.calendar.data.EventMappings.StartDate.name] = start;
            o[Ext.calendar.data.EventMappings.EndDate.name] = end;

            this.fireEvent('rangeselect', this, o, Ext.bind(this.onCalendarEndDragComplete, this, [onComplete]));
        }
    },

    // private
    onCalendarEndDragComplete: function(onComplete) {
        // callback for the drop zone to clean up
        onComplete();
        // clear flag for other events to resume normally
        this.dragPending = false;
    },

    // private
    onUpdate: function(ds, rec, operation) {
        if (this.monitorStoreEvents === false) {
            return;
        }
        if (operation == Ext.data.Record.COMMIT) {
            this.refresh();
            if (this.enableFx && this.enableUpdateFx) {
                this.doUpdateFx(this.getEventEls(rec.data[Ext.calendar.data.EventMappings.EventId.name]), {
                    scope: this
                });
            }
        }
    },


    doUpdateFx: function(els, o) {
        this.highlightEvent(els, null, o);
    },

    // private
    onAdd: function(ds, records, index) {
        if (this.monitorStoreEvents === false) {
            return;
        }
        var rec = records[0];
        this.tempEventId = rec.id;
        this.refresh();

        if (this.enableFx && this.enableAddFx) {
            this.doAddFx(this.getEventEls(rec.data[Ext.calendar.data.EventMappings.EventId.name]), {
                scope: this
            });
        }
    },

    doAddFx: function(els, o) {
        els.fadeIn(Ext.apply(o, {
            duration: 2000
        }));
    },

    // private
    onRemove: function(ds, rec) {
        if (this.monitorStoreEvents === false) {
            return;
        }
        if (this.enableFx && this.enableRemoveFx) {
            this.doRemoveFx(this.getEventEls(rec.data[Ext.calendar.data.EventMappings.EventId.name]), {
                remove: true,
                scope: this,
                callback: this.refresh
            });
        }
        else {
            this.getEventEls(rec.data[Ext.calendar.data.EventMappings.EventId.name]).remove();
            this.refresh();
        }
    },

    doRemoveFx: function(els, o) {
        els.fadeOut(o);
    },

    
    highlightEvent: function(els, color, o) {
        if (this.enableFx) {
            var c;
            ! (Ext.isIE || Ext.isOpera) ?
            els.highlight(color, o) :
            // Fun IE/Opera handling:
            els.each(function(el) {
                el.highlight(color, Ext.applyIf({
                    attr: 'color'
                },
                o));
                c = el.down('.ext-cal-evm');
                if (c) {
                    c.highlight(color, o);
                }
            },
            this);
        }
    },

    
    getEventIdFromEl: function (el) {
        el = Ext.get(el);

        var parts,
            id = '',
            cls,
            classes = el.dom.className.split(' ');

        Ext.each(classes, function (cls) {
            parts = cls.split(this.eventElIdDelimiter);
            if (parts.length > 1) {
                id = parts[1];
                return false;
            }
        }, this);

        return id;
    },

    // private
    getEventId: function(eventId) {
        if (eventId === undefined && this.tempEventId) {
            eventId = this.tempEventId;
        }
        return eventId;
    },

    
    getEventSelectorCls: function(eventId, forSelect) {
        var prefix = forSelect ? '.': '';
        return prefix + this.id + this.eventElIdDelimiter + this.getEventId(eventId);
    },

    
    getEventEls: function(eventId) {
        var els = Ext.select(this.getEventSelectorCls(this.getEventId(eventId), true), false, this.el.id);
        return new Ext.CompositeElement(els);
    },

    
    isToday: function() {
        var today = Ext.Date.clearTime(new Date()).getTime();
        return this.viewStart.getTime() <= today && this.viewEnd.getTime() >= today;
    },

    // private
    onDataChanged: function(store) {
        if (this.startDate) {
            this.setStartDate(this.startDate, false, false);
        }
		this.refresh();
    },

    // private
    isEventVisible: function(evt) {
        var M = Ext.calendar.data.EventMappings,
            data = evt.data || evt,
            start = this.viewStart.getTime(),
            end = this.viewEnd.getTime(),
            evStart = data[M.StartDate.name].getTime(),
            evEnd = data[M.EndDate.name].getTime();
            evEnd = Ext.calendar.util.Date.add(data[M.EndDate.name], {seconds: -1}).getTime();

        return this.rangesOverlap(start, end, evStart, evEnd);
    },
    
    rangesOverlap: function(start1, end1, start2, end2) {
        var startsInRange = (start1 >= start2 && start1 <= end2),
            endsInRange = (end1 >= start2 && end1 <= end2),
            spansRange = (start1 <= start2 && end1 >= end2);
            
        return (startsInRange || endsInRange || spansRange);
    },

    // private
    isOverlapping: function(evt1, evt2) {
        var ev1 = evt1.data ? evt1.data: evt1,
        ev2 = evt2.data ? evt2.data: evt2,
        M = Ext.calendar.data.EventMappings,
        start1 = ev1[M.StartDate.name].getTime(),
        end1 = Ext.calendar.util.Date.add(ev1[M.EndDate.name], {seconds: -1}).getTime(),
        start2 = ev2[M.StartDate.name].getTime(),
        end2 = Ext.calendar.util.Date.add(ev2[M.EndDate.name], {seconds: -1}).getTime();

        if (end1 < start1) {
            end1 = start1;
        }
        if (end2 < start2) {
            end2 = start2;
        }

        return (start1 <= end2 && end1 >= start2);
    },

    getDayEl: function(dt) {
        return Ext.get(this.getDayId(dt));
    },

    getDayId: function(dt) {
        if (Ext.isDate(dt)) {
            dt = Ext.Date.format(dt, 'Ymd');
        }
        return this.id + this.dayElIdDelimiter + dt;
    },

    
    getStartDate: function() {
        return this.startDate;
    },	
	
    
    setStartDate: function(start, refresh, reload) {
        this.startDate = Ext.Date.clearTime(start);
        this.setViewBounds(start);
        if (reload) {			
			this.store.load({
				params: {
					start: Ext.Date.format(this.viewStart, 'm-d-Y'),
					end: Ext.Date.format(this.viewEnd, 'm-d-Y')
				}
			});
		}
        if (refresh === true) {
            this.refresh();
        }
        this.fireEvent('datechange', this, this.startDate, this.viewStart, this.viewEnd);
    },

    // private
    setViewBounds: function (startDate) {
        var me = this,
            start = startDate || me.startDate,
            offset = start.getDay() - me.startDay,
            Dt = Ext.calendar.util.Date;

        if (offset < 0) {
            // if the offset is negative then some days will be in the previous week so add a week to the offset
            offset += 7;
        }

        switch (this.weekCount) {
            case 0:
            case 1:
                me.viewStart = me.dayCount < 7 && !me.startDayIsStatic ?
                    start : Dt.add(start, {
                    days: -offset,
                    clearTime: true
                });
                me.viewEnd = Dt.add(me.viewStart, {
                    days: me.dayCount || 7,
                    seconds: -1
                });
                return;

            case -1:
                // auto by month
                start = Ext.Date.getFirstDateOfMonth(start);
                offset = start.getDay() - me.startDay;
                if (offset < 0) {
                    // if the offset is negative then some days will be in the previous week so add a week to the offset
                    offset += 7;
                }
                me.viewStart = Dt.add(start, {
                    days: -offset,
                    clearTime: true
                });

                // start from current month start, not view start:
                var end = Dt.add(start, {
                    months: 1,
                    seconds: -1
                });

                // fill out to the end of the week:
                offset = me.startDay;
                if (offset > end.getDay()) {
                    // if the offset is larger than the end day index then the last row will be empty so skip it
                    offset -= 7;
                }

                me.viewEnd = Dt.add(end, {
                    days: 6 - end.getDay() + offset
                });
                return;

            default:
                me.viewStart = Dt.add(start, {
                    days: -offset,
                    clearTime: true
                });
                me.viewEnd = Dt.add(me.viewStart, {
                    days: me.weekCount * 7,
                    seconds: -1
                });
        }
    },

    // private
    getViewBounds: function() {
        return {
            start: this.viewStart,
            end: this.viewEnd
        };
    },

    
    sortEventRecordsForDay: function(evts) {
        if (evts.length < 2) {
            return;
        }
        evts.sortBy(Ext.bind(function(evtA, evtB) {
            var a = evtA.data,
            b = evtB.data,
            M = Ext.calendar.data.EventMappings;

            // Always sort all day events before anything else
            if (a[M.IsAllDay.name]) {
                return - 1;
            }
            else if (b[M.IsAllDay.name]) {
                return 1;
            }
            if (this.spansHavePriority) {
                // This logic always weights span events higher than non-span events
                // (at the possible expense of start time order). This seems to
                // be the approach used by Google calendar and can lead to a more
                // visually appealing layout in complex cases, but event order is
                // not guaranteed to be consistent.
                var diff = Ext.calendar.util.Date.diffDays;
                if (diff(a[M.StartDate.name], a[M.EndDate.name]) > 0) {
                    if (diff(b[M.StartDate.name], b[M.EndDate.name]) > 0) {
                        // Both events are multi-day
                        if (a[M.StartDate.name].getTime() == b[M.StartDate.name].getTime()) {
                            // If both events start at the same time, sort the one
                            // that ends later (potentially longer span bar) first
                            return b[M.EndDate.name].getTime() - a[M.EndDate.name].getTime();
                        }
                        return a[M.StartDate.name].getTime() - b[M.StartDate.name].getTime();
                    }
                    return - 1;
                }
                else if (diff(b[M.StartDate.name], b[M.EndDate.name]) > 0) {
                    return 1;
                }
                return a[M.StartDate.name].getTime() - b[M.StartDate.name].getTime();
            }
            else {
                // Doing this allows span and non-span events to intermingle but
                // remain sorted sequentially by start time. This seems more proper
                // but can make for a less visually-compact layout when there are
                // many such events mixed together closely on the calendar.
                return a[M.StartDate.name].getTime() - b[M.StartDate.name].getTime();
            }
        }, this));
    },

    
    moveTo: function(dt, noRefresh, reload) {
        if (Ext.isDate(dt)) {
            this.setStartDate(dt, undefined, reload);
            if (noRefresh !== false) {
                this.refresh();
            }
            return this.startDate;
        }
        return dt;
    },

    
    moveNext: function(noRefresh, reload) {
        return this.moveTo(Ext.calendar.util.Date.add(this.viewEnd, {days: 1}),noRefresh, reload);
    },

    
    movePrev: function(noRefresh, reload) {
        var days = Ext.calendar.util.Date.diffDays(this.viewStart, this.viewEnd) + 1;
        return this.moveDays( - days, noRefresh, reload);
    },

    
    moveMonths: function(value, noRefresh, reload) {
        return this.moveTo(Ext.calendar.util.Date.add(this.startDate, {months: value}), noRefresh, reload);
    },

    
    moveWeeks: function(value, noRefresh, reload) {
        return this.moveTo(Ext.calendar.util.Date.add(this.startDate, {days: value * 7}), noRefresh, reload);
    },

    
    moveDays: function(value, noRefresh, reload) {
        return this.moveTo(Ext.calendar.util.Date.add(this.startDate, {days: value}), noRefresh, reload);
    },

    
    moveToday: function(noRefresh, reload) {
        return this.moveTo(new Date(), noRefresh, reload);
    },

    
    setStore: function(store, initial) {
        if (!initial && this.store) {
            this.store.un("datachanged", this.onDataChanged, this);
            this.store.un("add", this.onAdd, this);
            this.store.un("remove", this.onRemove, this);
            this.store.un("update", this.onUpdate, this);
            this.store.un("clear", this.refresh, this);
        }
        if (store) {
            store.on("datachanged", this.onDataChanged, this);
            store.on("add", this.onAdd, this);
            store.on("remove", this.onRemove, this);
            store.on("update", this.onUpdate, this);
            store.on("clear", this.refresh, this);
        }
        this.store = store;
        if (store && store.getCount() > 0) {
            this.refresh();
        }
    },

    getEventRecord: function(id) {
        var idx = this.store.find(Ext.calendar.data.EventMappings.EventId.name, id);
        return this.store.getAt(idx);
    },

    getEventRecordFromEl: function(el) {
        return this.getEventRecord(this.getEventIdFromEl(el));
    },

    // private
    getParams: function() {
        return {
            viewStart: this.viewStart,
            viewEnd: this.viewEnd,
            startDate: this.startDate,
            dayCount: this.dayCount,
            weekCount: this.weekCount,
            title: this.getTitle()
        };
    },

    getTitle: function() {
        return Ext.Date.format(this.startDate, 'F Y');
    },

    
    onClick: function(e, t) {
        var el = e.getTarget(this.eventSelector, 5);
        if (el) {
            var id = this.getEventIdFromEl(el);
            this.fireEvent('eventclick', this, this.getEventRecord(id), el);
            return true;
        }
    },

    // private
    onMouseOver: function(e, t) {
        if (this.trackMouseOver !== false && (this.dragZone == undefined || !this.dragZone.dragging)) {
            if (!this.handleEventMouseEvent(e, t, 'over')) {
                this.handleDayMouseEvent(e, t, 'over');
            }
        }
    },

    // private
    onMouseOut: function(e, t) {
        if (this.trackMouseOver !== false && (this.dragZone == undefined || !this.dragZone.dragging)) {
            if (!this.handleEventMouseEvent(e, t, 'out')) {
                this.handleDayMouseEvent(e, t, 'out');
            }
        }
    },

    // private
    handleEventMouseEvent: function(e, t, type) {
        var el = e.getTarget(this.eventSelector, 5, true),
            rel,
            els,
            evtId;
        if (el) {
            rel = Ext.get(e.getRelatedTarget());
            if (el == rel || el.contains(rel)) {
                return true;
            }

            evtId = this.getEventIdFromEl(el);

            if (this.eventOverClass) {
                els = this.getEventEls(evtId);
                els[type == 'over' ? 'addCls': 'removeCls'](this.eventOverClass);
            }
            this.fireEvent('event' + type, this, this.getEventRecord(evtId), el);
            return true;
        }
        return false;
    },

    // private
    getDateFromId: function(id, delim) {
        var parts = id.split(delim);
        return parts[parts.length - 1];
    },

    // private
    handleDayMouseEvent: function(e, t, type) {
        t = e.getTarget('td', 3);
        if (t) {
            if (t.id && t.id.indexOf(this.dayElIdDelimiter) > -1) {
                var dt = this.getDateFromId(t.id, this.dayElIdDelimiter),
                rel = Ext.get(e.getRelatedTarget()),
                relTD,
                relDate;

                if (rel) {
                    relTD = rel.is('td') ? rel: rel.up('td', 3);
                    relDate = relTD && relTD.id ? this.getDateFromId(relTD.id, this.dayElIdDelimiter) : '';
                }
                if (!rel || dt != relDate) {
                    var el = this.getDayEl(dt);
                    if (el && this.dayOverClass != '') {
                        el[type == 'over' ? 'addCls': 'removeCls'](this.dayOverClass);
                    }
                    this.fireEvent('day' + type, this, Ext.Date.parseDate(dt, "Ymd"), el);
                }
            }
        }
    },

    // private
    renderItems: function() {
        throw 'This method must be implemented by a subclass';
    },
    
    // private
    destroy: function(){
        this.callParent(arguments);
        
        if(this.el){
            this.el.un('contextmenu', this.onContextMenu, this);
        }
        Ext.destroy(
            this.editWin, 
            this.eventMenu,
            this.dragZone,
            this.dropZone
        );
    },
	
	isEventSpanning : function(evt) {
        var M = Ext.calendar.data.EventMappings,
            data = evt.data || evt,
            diff;
            
        diff = Ext.calendar.util.Date.diffDays(data[M.StartDate.name], data[M.EndDate.name]);
        
        return diff > 0;
    }
});

Ext.define('Ext.calendar.view.MonthDayDetail', {
    extend: 'Ext.Component',
    alias: 'widget.monthdaydetailview',

    requires: [
        'Ext.XTemplate',
        'Ext.calendar.view.AbstractCalendar'
    ],
    
    initComponent : function(){
        this.callParent(arguments);
        
        this.addEvents({
            eventsrendered: true
        });
    },

    afterRender: function() {
        this.tpl = this.getTemplate();

        this.callParent(arguments);

        this.el.on({
            'click': this.view.onClick,
            'mouseover': this.view.onMouseOver,
            'mouseout': this.view.onMouseOut,
            scope: this.view
        });
    },

    getTemplate: function() {
        if (!this.tpl) {
            this.tpl = new Ext.XTemplate(
                '<div class="ext-cal-mdv x-unselectable">',
                    '<table class="ext-cal-mvd-tbl" cellpadding="0" cellspacing="0">',
                        '<tbody>',
                            '<tpl for=".">',
                                '<tr><td class="ext-cal-ev">{markup}</td></tr>',
                            '</tpl>',
                        '</tbody>',
                    '</table>',
                '</div>'
            );
        }
        this.tpl.compile();
        return this.tpl;
    },

    update: function(dt) {
        this.date = dt;
        this.refresh();
    },

    refresh: function() {
        if (!this.rendered) {
            return;
        }
        var eventTpl = this.view.getEventTemplate(),

        templateData = [],

        evts = this.store.queryBy(function(rec) {
            var thisDt = Ext.Date.clearTime(this.date, true).getTime(),
                recStart = Ext.Date.clearTime(rec.data[Ext.calendar.data.EventMappings.StartDate.name], true).getTime(),
                startsOnDate = (thisDt == recStart),
                spansDate = false;

            if (!startsOnDate) {
                var recEnd = Ext.Date.clearTime(rec.data[Ext.calendar.data.EventMappings.EndDate.name], true).getTime();
                spansDate = recStart < thisDt && recEnd >= thisDt;
            }
            return startsOnDate || spansDate;
        },
        this);

        evts.each(function(evt) {
            var item = evt.data,
            M = Ext.calendar.data.EventMappings;

            item._renderAsAllDay = item[M.IsAllDay.name] || Ext.calendar.util.Date.diffDays(item[M.StartDate.name], item[M.EndDate.name]) > 0;
            item.spanLeft = Ext.calendar.util.Date.diffDays(item[M.StartDate.name], this.date) > 0;
            item.spanRight = Ext.calendar.util.Date.diffDays(this.date, item[M.EndDate.name]) > 0;
            item.spanCls = (item.spanLeft ? (item.spanRight ? 'ext-cal-ev-spanboth':
            'ext-cal-ev-spanleft') : (item.spanRight ? 'ext-cal-ev-spanright': ''));

            templateData.push({
                markup: eventTpl.apply(this.getTemplateEventData(item))
            });
        },
        this);

        this.tpl.overwrite(this.el, templateData);
        this.fireEvent('eventsrendered', this, this.date, evts.getCount());
    },

    getTemplateEventData: function(evt) {
        var data = this.view.getTemplateEventData(evt);
        data._elId = 'dtl-' + data._elId;
        return data;
    }
});


Ext.define('Ext.calendar.view.Month', {
    extend: 'Ext.calendar.view.AbstractCalendar',
    alias: 'widget.monthview',
    
    requires: [
        'Ext.XTemplate',
        'Ext.calendar.template.Month',
        'Ext.calendar.util.WeekEventRenderer',
        'Ext.calendar.view.MonthDayDetail'
    ],
    
    
    showTime: true,
    
    showTodayText: true,
    
    todayText: 'Today',
    
    showHeader: false,
    
    showWeekLinks: false,
    
    showWeekNumbers: false,
    
    weekLinkOverClass: 'ext-week-link-over',

    
    moreText: "+ {0} more...",

    //private properties -- do not override:
    daySelector: '.ext-cal-day',
    moreSelector: '.ext-cal-ev-more',
    weekLinkSelector: '.ext-cal-week-link',
    weekCount: -1,
    // defaults to auto by month
    dayCount: 7,
    moreElIdDelimiter: '-more-',
    weekLinkIdDelimiter: 'ext-cal-week-',    

    // private
    initComponent: function() {
        this.callParent(arguments);
        
        this.addEvents({
            
            dayclick: true,
            
            weekclick: true,
            // inherited docs
            dayover: true,
            // inherited docs
            dayout: true
        });
    },

    // private
    initDD: function() {
        var cfg = {
            view: this,
            createText: this.ddCreateEventText,
            moveText: this.ddMoveEventText,
            ddGroup: 'MonthViewDD'
        };

        this.dragZone = new Ext.calendar.dd.DragZone(this.el, cfg);
        this.dropZone = new Ext.calendar.dd.DropZone(this.el, cfg);
    },

    // private
    onDestroy: function() {
        Ext.destroy(this.ddSelector);
        Ext.destroy(this.dragZone);
        Ext.destroy(this.dropZone);
        
        this.callParent(arguments);
    },

    // private
    afterRender: function() {
        if (!this.tpl) {
            this.tpl = new Ext.calendar.template.Month({
                id: this.id,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime,
                showHeader: this.showHeader,
                showWeekLinks: this.showWeekLinks,
                showWeekNumbers: this.showWeekNumbers
            });
        }
        this.tpl.compile();
        this.addCls('ext-cal-monthview ext-cal-ct');

        this.callParent(arguments);
    },

    // private
    onResize: function() {
        var me = this;
        me.callParent(arguments);
        me.maxEventsPerDay = me.getMaxEventsPerDay();
        if (me.monitorResize) {            
            me.refresh();
        }
    },

    // private
    forceSize: function() {
        // Compensate for the week link gutter width if visible
        if(this.showWeekLinks && this.el){
            var hd = this.el.down('.ext-cal-hd-days-tbl'),
                bgTbl = this.el.select('.ext-cal-bg-tbl'),
                evTbl = this.el.select('.ext-cal-evt-tbl'),
                wkLinkW = this.el.down('.ext-cal-week-link').getWidth(),
                w = this.el.getWidth()-wkLinkW;
            
            hd.setWidth(w);
            bgTbl.setWidth(w);
            evTbl.setWidth(w);
        }
        this.callParent(arguments);
    },

    //private
    initClock: function() {
        if (Ext.fly(this.id + '-clock') !== null) {
            this.prevClockDay = new Date().getDay();
            if (this.clockTask) {
                Ext.TaskManager.stop(this.clockTask);
            }
            this.clockTask = Ext.TaskManager.start({
                run: function() {
                    var el = Ext.fly(this.id + '-clock'),
                    t = new Date();

                    if (t.getDay() == this.prevClockDay) {
                        if (el) {
                            el.update(Ext.Date.format(t, 'g:i a'));
                        }
                    }
                    else {
                        this.prevClockDay = t.getDay();
                        this.moveTo(t);
                    }
                },
                scope: this,
                interval: 1000
            });
        }
    },

    // inherited docs
    getEventBodyMarkup: function() {
        if (!this.eventBodyMarkup) {
            this.eventBodyMarkup = ['{Title}',
            '<tpl if="_isReminder">',
                '<i class="ext-cal-ic ext-cal-ic-rem">&nbsp;</i>',
            '</tpl>',
            '<tpl if="_isRecurring">',
                '<i class="ext-cal-ic ext-cal-ic-rcr">&nbsp;</i>',
            '</tpl>',
            '<tpl if="spanLeft">',
                '<i class="ext-cal-spl">&nbsp;</i>',
            '</tpl>',
            '<tpl if="spanRight">',
                '<i class="ext-cal-spr">&nbsp;</i>',
            '</tpl>'
            ].join('');
        }
        return this.eventBodyMarkup;
    },

    // inherited docs
    getEventTemplate: function() {
        if (!this.eventTpl) {
            var tpl,
            body = this.getEventBodyMarkup();

            tpl = !(Ext.isIE || Ext.isOpera) ?
            new Ext.XTemplate(
                '<div id="{_elId}" class="{_selectorCls} {_colorCls} {spanCls} ext-cal-evt ext-cal-evr">',
                    body,
                '</div>'
            )
            : new Ext.XTemplate(
                '<tpl if="_renderAsAllDay">',
                    '<div id="{_elId}" class="{_selectorCls} {spanCls} {_colorCls} ext-cal-evt ext-cal-evo">',
                        '<div class="ext-cal-evm">',
                            '<div class="ext-cal-evi">',
                '</tpl>',
                '<tpl if="!_renderAsAllDay">',
                    '<div id="{_elId}" class="{_selectorCls} {_colorCls} ext-cal-evt ext-cal-evr">',
                '</tpl>',
                    body,
                '<tpl if="_renderAsAllDay">',
                            '</div>',
                        '</div>',
                '</tpl>',
                    '</div>'
            );
            tpl.compile();
            this.eventTpl = tpl;
        }
        return this.eventTpl;
    },

    // private
    getTemplateEventData: function(evt) {
        var M = Ext.calendar.data.EventMappings,
        selector = this.getEventSelectorCls(evt[M.EventId.name]),
        title = evt[M.Title.name];

        return Ext.applyIf({
            _selectorCls: selector,
            _colorCls: 'ext-color-' + (evt[M.CalendarId.name] ?
            evt[M.CalendarId.name] : 'default') + (evt._renderAsAllDay ? '-ad': ''),
            _elId: selector + '-' + evt._weekIndex,
            _isRecurring: evt.Recurrence && evt.Recurrence != '',
            _isReminder: evt[M.Reminder.name] && evt[M.Reminder.name] != '',
            Title: (evt[M.IsAllDay.name] ? '' : Ext.Date.format(evt[M.StartDate.name], 'g:ia ')) + (!title || title.length == 0 ? '(No title)' : title)
        },
        evt);
    },

    // private
    refresh: function() {
        if (this.detailPanel) {
            this.detailPanel.hide();
        }
        this.callParent(arguments);

        if (this.showTime !== false) {
            this.initClock();
        }
    },

    // private
    renderItems: function() {
        Ext.calendar.util.WeekEventRenderer.render({
            eventGrid: this.allDayOnly ? this.allDayGrid: this.eventGrid,
            viewStart: this.viewStart,
            tpl: this.getEventTemplate(),
            maxEventsPerDay: this.maxEventsPerDay,
            id: this.id,
            templateDataFn: Ext.bind(this.getTemplateEventData, this),
            evtMaxCount: this.evtMaxCount,
            weekCount: this.weekCount,
            dayCount: this.dayCount,
            moreText: this.moreText
        });
        this.fireEvent('eventsrendered', this);
    },

    // private
    getDayEl: function(dt) {
        return Ext.get(this.getDayId(dt));
    },

    // private
    getDayId: function(dt) {
        if (Ext.isDate(dt)) {
            dt = Ext.Date.format(dt, 'Ymd');
        }
        return this.id + this.dayElIdDelimiter + dt;
    },

    // private
    getWeekIndex: function(dt) {
        var el = this.getDayEl(dt).up('.ext-cal-wk-ct');
        return parseInt(el.id.split('-wk-')[1], 10);
    },

    // private
    getDaySize: function(contentOnly) {
        var box = this.el.down(this.daySelector).getBox(),
        w = box.width,
        h = box.height;

        if (contentOnly) {
            var hd = this.el.select('.ext-cal-dtitle').first().parent('tr');
            h = hd ? h - hd.getHeight(true) : h;
        }
        return {
            height: h,
            width: w
        };
    },

    // private
    getEventHeight: function() {
        if (!this.eventHeight) {
            var evt = this.el.down('.ext-cal-evt');
            this.eventHeight = evt ? evt.parent('tr').getHeight() : 18;
            var evt = this.el.down('.ext-cal-evr');
            if (evt) {
                this.eventHeight = Math.max(this.eventHeight, evt ? evt.parent('tr').getHeight() : 18);
            }
        }
        return this.eventHeight;
    },

    // private
    getMaxEventsPerDay: function() {
        var dayHeight = this.getDaySize(true).height,
            h = this.getEventHeight(),
            max = Math.max(Math.floor((dayHeight - h) / h), 0);

        return max;
    },

    // private
    getDayAt: function(x, y) {
        var box = this.el.getBox(),
            daySize = this.getDaySize(),
            dayL = Math.floor(((x - box.x) / daySize.width)),
            dayT = Math.floor(((y - box.y) / daySize.height)),
            days = (dayT * 7) + dayL,
            dt = Ext.calendar.util.Date.add(this.viewStart, {days: days});
        return {
            date: dt,
            el: this.getDayEl(dt)
        };
    },

    // inherited docs
    moveNext: function() {
        return this.moveMonths(1, undefined, true);
    },

    // inherited docs
    movePrev: function() {
        return this.moveMonths( - 1, undefined, true);
    },

    // private
    onInitDrag: function() {
        this.callParent(arguments);
        
        if (this.dayOverClass) {
            Ext.select(this.daySelector).removeCls(this.dayOverClass);
        }
        if (this.detailPanel) {
            this.detailPanel.hide();
        }
    },

    // private
    onMoreClick: function(dt) {
        if (!this.detailPanel) {
            this.detailPanel = Ext.create('Ext.Panel', {
                id: this.id + '-details-panel',
                title: Ext.Date.format(dt, 'F j'),
                layout: 'fit',
                floating: true,
                renderTo: Ext.getBody(),
                tools: [{
                    type: 'close',
                    handler: function(e, t, p) {
                        p.ownerCt.hide();
                    }
                }],
                items: {
                    xtype: 'monthdaydetailview',
                    id: this.id + '-details-view',
                    date: dt,
                    view: this,
                    store: this.store,
                    listeners: {
                        'eventsrendered': Ext.bind(this.onDetailViewUpdated, this)
                    }
                }
            });
        }
        else {
            this.detailPanel.setTitle(Ext.Date.format(dt, 'F j'));
        }
        this.detailPanel.getComponent(this.id + '-details-view').update(dt);
    },

    // private
    onDetailViewUpdated : function(view, dt, numEvents){
        var p = this.detailPanel,
            dayEl = this.getDayEl(dt),
            box = dayEl.getBox();
        
        p.setWidth(Math.max(box.width, 220));
        p.show();
        p.getPositionEl().alignTo(dayEl, 't-t?');
    },

    // private
    onHide: function() {
        this.callParent(arguments);
        
        if (this.detailPanel) {
            this.detailPanel.hide();
        }
    },

    // private
    onClick: function(e, t) {
        if (this.detailPanel) {
            this.detailPanel.hide();
        }
        if (Ext.calendar.view.Month.superclass.onClick.apply(this, arguments)) {
            // The superclass handled the click already so exit
            return;
        }
        if (this.dropZone) {
            this.dropZone.clearShims();
        }
        var el = e.getTarget(this.weekLinkSelector, 3),
            dt,
            parts;
        if (el) {
            dt = el.id.split(this.weekLinkIdDelimiter)[1];
            this.fireEvent('weekclick', this, Ext.Date.parseDate(dt, 'Ymd'));
            return;
        }
        el = e.getTarget(this.moreSelector, 3);
        if (el) {
            dt = el.id.split(this.moreElIdDelimiter)[1];
            this.onMoreClick(Ext.Date.parseDate(dt, 'Ymd'));
            return;
        }
        el = e.getTarget('td', 3);
        if (el) {
            if (el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                parts = el.id.split(this.dayElIdDelimiter);
                dt = parts[parts.length - 1];

                this.fireEvent('dayclick', this, Ext.Date.parseDate(dt, 'Ymd'), false, Ext.get(this.getDayId(dt)));
                return;
            }
        }
    },

    // private
    handleDayMouseEvent: function(e, t, type) {
        var el = e.getTarget(this.weekLinkSelector, 3, true);
        if (el && this.weekLinkOverClass) {
            el[type == 'over' ? 'addCls': 'removeCls'](this.weekLinkOverClass);
            return;
        }
        this.callParent(arguments);
    }
});


Ext.define('Ext.calendar.view.DayHeader', {
    extend: 'Ext.calendar.view.Month',
    alias: 'widget.dayheaderview',

    requires: [
        'Ext.calendar.template.DayHeader'
    ],
    
    // private configs
    weekCount: 1,
    dayCount: 1,
    allDayOnly: true,
    monitorResize: false,

    

    // private
    afterRender: function() {
        if (!this.tpl) {
            this.tpl = new Ext.calendar.template.DayHeader({
                id: this.id,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime
            });
        }
        this.tpl.compile();
        this.addCls('ext-cal-day-header');

        this.callParent(arguments);
    },

    // private
    forceSize: Ext.emptyFn,

    // private
    refresh: function() {
        this.callParent(arguments);
        this.recalcHeaderBox();
    },

    // private
    recalcHeaderBox : function(){
        var tbl = this.el.down('.ext-cal-evt-tbl'),
            h = tbl.getHeight();
        
        this.el.setHeight(h+7);
        
        // These should be auto-height, but since that does not work reliably
        // across browser / doc type, we have to size them manually
        this.el.down('.ext-cal-hd-ad-inner').setHeight(h+5);
        this.el.down('.ext-cal-bg-tbl').setHeight(h+5);
    },

    // private
    moveNext: function(noRefresh) {
        return this.moveDays(this.dayCount, noRefresh, true);
    },

    // private
    movePrev: function(noRefresh) {
        return this.moveDays( - this.dayCount, noRefresh, true);
    },

    // private
    onClick: function(e, t) {
        var el = e.getTarget('td', 3),
            parts,
            dt;
        if (el) {
            if (el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                parts = el.id.split(this.dayElIdDelimiter);
                dt = parts[parts.length - 1];

                this.fireEvent('dayclick', this, Ext.Date.parseDate(dt, 'Ymd'), true, Ext.get(this.getDayId(dt)));
                return;
            }
        }
        this.callParent(arguments);
    }
});


Ext.define('Ext.calendar.view.DayBody', {
    extend: 'Ext.calendar.view.AbstractCalendar',
    alias: 'widget.daybodyview',

    requires: [
        'Ext.XTemplate',
        'Ext.calendar.template.DayBody',
        'Ext.calendar.data.EventMappings',
        'Ext.calendar.dd.DayDragZone',
        'Ext.calendar.dd.DayDropZone'
    ],
    
    //private
    dayColumnElIdDelimiter: '-day-col-',

    //private
    initComponent: function() {
        this.callParent(arguments);

        this.addEvents({
            
            eventresize: true,
            
            dayclick: true
        });
    },

    //private
    initDD: function() {
        var cfg = {
            createText: this.ddCreateEventText,
            moveText: this.ddMoveEventText,
            resizeText: this.ddResizeEventText
        };

        this.el.ddScrollConfig = {
            // scrolling is buggy in IE/Opera for some reason.  A larger vthresh
            // makes it at least functional if not perfect
            vthresh: Ext.isIE || Ext.isOpera ? 100: 40,
            hthresh: -1,
            frequency: 50,
            increment: 100,
            ddGroup: 'DayViewDD'
        };
        this.dragZone = new Ext.calendar.dd.DayDragZone(this.el, Ext.apply({
            view: this,
            containerScroll: true
        },
        cfg));

        this.dropZone = new Ext.calendar.dd.DayDropZone(this.el, Ext.apply({
            view: this
        },
        cfg));
    },

    //private
    refresh: function() {
        var top = this.el.getScroll().top;
        this.prepareData();
        this.renderTemplate();
        this.renderItems();

        // skip this if the initial render scroll position has not yet been set.
        // necessary since IE/Opera must be deferred, so the first refresh will
        // override the initial position by default and always set it to 0.
        if (this.scrollReady) {
            this.scrollTo(top);
        }
    },

    
    scrollTo: function(y, defer) {
        defer = defer || (Ext.isIE || Ext.isOpera);
        if (defer) {
            Ext.defer(function() {
                this.el.scrollTo('top', y, true);
                this.scrollReady = true;
            }, 10, this);
        }
        else {
            this.el.scrollTo('top', y, true);
            this.scrollReady = true;
        }
    },

    // private
    afterRender: function() {
        if (!this.tpl) {
            this.tpl = new Ext.calendar.template.DayBody({
                id: this.id,
                dayCount: this.dayCount,
                showTodayText: this.showTodayText,
                todayText: this.todayText,
                showTime: this.showTime
            });
        }
        this.tpl.compile();

        this.addCls('ext-cal-body-ct');

        this.callParent(arguments);

        // default scroll position to 7am:
        this.scrollTo(7 * 42);
    },

    // private
    forceSize: Ext.emptyFn,

    // private
    onEventResize: function(rec, data) {
        var D = Ext.calendar.util.Date,
        start = Ext.calendar.data.EventMappings.StartDate.name,
        end = Ext.calendar.data.EventMappings.EndDate.name;

        if (D.compare(rec.data[start], data.StartDate) === 0 &&
        D.compare(rec.data[end], data.EndDate) === 0) {
            // no changes
            return;
        }
        rec.set(start, data.StartDate);
        rec.set(end, data.EndDate);

        this.fireEvent('eventresize', this, rec);
    },

    // inherited docs
    getEventBodyMarkup: function() {
        if (!this.eventBodyMarkup) {
            this.eventBodyMarkup = ['{Title}',
            '<tpl if="_isReminder">',
            '<i class="ext-cal-ic ext-cal-ic-rem">&nbsp;</i>',
            '</tpl>',
            '<tpl if="_isRecurring">',
            '<i class="ext-cal-ic ext-cal-ic-rcr">&nbsp;</i>',
            '</tpl>'
            //                '<tpl if="spanLeft">',
            //                    '<i class="ext-cal-spl">&nbsp;</i>',
            //                '</tpl>',
            //                '<tpl if="spanRight">',
            //                    '<i class="ext-cal-spr">&nbsp;</i>',
            //                '</tpl>'
            ].join('');
        }
        return this.eventBodyMarkup;
    },

    // inherited docs
    getEventTemplate: function() {
        if (!this.eventTpl) {
            this.eventTpl = !(Ext.isIE || Ext.isOpera) ?
            new Ext.XTemplate(
            '<div id="{_elId}" class="{_selectorCls} {_colorCls} ext-cal-evt ext-cal-evr" style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
            '<div class="ext-evt-bd">', this.getEventBodyMarkup(), '</div>',
            '<div class="ext-evt-rsz"><div class="ext-evt-rsz-h">&nbsp;</div></div>',
            '</div>'
            )
            : new Ext.XTemplate(
            '<div id="{_elId}" class="ext-cal-evt {_selectorCls} {_colorCls}-x" style="left: {_left}%; width: {_width}%; top: {_top}px;">',
            '<div class="ext-cal-evb">&nbsp;</div>',
            '<dl style="height: {_height}px;" class="ext-cal-evdm">',
            '<dd class="ext-evt-bd">',
            this.getEventBodyMarkup(),
            '</dd>',
            '<div class="ext-evt-rsz"><div class="ext-evt-rsz-h">&nbsp;</div></div>',
            '</dl>',
            '<div class="ext-cal-evb">&nbsp;</div>',
            '</div>'
            );
            this.eventTpl.compile();
        }
        return this.eventTpl;
    },

    
    getEventAllDayTemplate: function() {
        if (!this.eventAllDayTpl) {
            var tpl,
            body = this.getEventBodyMarkup();

            tpl = !(Ext.isIE || Ext.isOpera) ?
            new Ext.XTemplate(
            '<div id="{_elId}" class="{_selectorCls} {_colorCls} {spanCls} ext-cal-evt ext-cal-evr" style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
            body,
            '</div>'
            )
            : new Ext.XTemplate(
            '<div id="{_elId}" class="ext-cal-evt" style="left: {_left}%; width: {_width}%; top: {_top}px; height: {_height}px;">',
            '<div class="{_selectorCls} {spanCls} {_colorCls} ext-cal-evo">',
            '<div class="ext-cal-evm">',
            '<div class="ext-cal-evi">',
            body,
            '</div>',
            '</div>',
            '</div></div>'
            );
            tpl.compile();
            this.eventAllDayTpl = tpl;
        }
        return this.eventAllDayTpl;
    },

    // private
    getTemplateEventData: function(evt) {
        var selector = this.getEventSelectorCls(evt[Ext.calendar.data.EventMappings.EventId.name]),
        data = {},
        M = Ext.calendar.data.EventMappings;

        this.getTemplateEventBox(evt);

        data._selectorCls = selector;
        data._colorCls = 'ext-color-' + (evt[M.CalendarId.name] || '0') + (evt._renderAsAllDay ? '-ad': '');
        data._elId = selector + (evt._weekIndex ? '-' + evt._weekIndex: '');
        data._isRecurring = evt.Recurrence && evt.Recurrence != '';
        data._isReminder = evt[M.Reminder.name] && evt[M.Reminder.name] != '';
        var title = evt[M.Title.name];
        data.Title = (evt[M.IsAllDay.name] ? '': Ext.Date.format(evt[M.StartDate.name], 'g:ia ')) + (!title || title.length == 0 ? '(No title)': title);

        return Ext.applyIf(data, evt);
    },

    // private
    getTemplateEventBox: function(evt) {
        var heightFactor = 0.7,
            start = evt[Ext.calendar.data.EventMappings.StartDate.name],
            end = evt[Ext.calendar.data.EventMappings.EndDate.name],
            startMins = start.getHours() * 60 + start.getMinutes(),
            endMins = end.getHours() * 60 + end.getMinutes(),
            diffMins = endMins - startMins;

        evt._left = 0;
        evt._width = 100;
        evt._top = Math.round(startMins * heightFactor);
        evt._height = Math.max((diffMins * heightFactor), 15);
    },

    // private
    renderItems: function(){
        var day = 0, evts = [];
        for(; day < this.dayCount; day++){
            var ev = emptyCells = skipped = 0, 
                d = this.eventGrid[0][day],
                ct = d ? d.length : 0, 
                evt;
            
            for(; ev < ct; ev++){
                evt = d[ev];
                if(!evt){
                    continue;
                }
                var item = evt.data || evt.event.data,
                    M = Ext.calendar.data.EventMappings,
                    ad = item[M.IsAllDay.name] === true,
                    span = this.isEventSpanning(evt.event || evt),
                    renderAsAllDay = ad || span;
                         
                if(renderAsAllDay){
                    // this event is already rendered in the header view
                    continue;
                }
                Ext.apply(item, {
                    cls: 'ext-cal-ev',
                    _positioned: true
                });
                evts.push({
                    data: this.getTemplateEventData(item),
                    date: Ext.calendar.util.Date.add(this.viewStart, {days: day})
                });
            }
        }
        
        // overlapping event pre-processing loop
        var i = j = 0, overlapCols = [], l = evts.length, prevDt;
        for(; i<l; i++){
            var evt = evts[i].data, 
                evt2 = null, 
                dt = evt[Ext.calendar.data.EventMappings.StartDate.name].getDate();
            
            for(j=0; j<l; j++){
                if(i==j)continue;
                evt2 = evts[j].data;
                if(this.isOverlapping(evt, evt2)){
                    evt._overlap = evt._overlap == undefined ? 1 : evt._overlap+1;
                    if(i<j){
                        if(evt._overcol===undefined){
                            evt._overcol = 0;
                        }
                        evt2._overcol = evt._overcol+1;
                        overlapCols[dt] = overlapCols[dt] ? Math.max(overlapCols[dt], evt2._overcol) : evt2._overcol;
                    }
                }
            }
        }
        
        // rendering loop
        for(i=0; i<l; i++){
            var evt = evts[i].data,
                dt = evt[Ext.calendar.data.EventMappings.StartDate.name].getDate();
                
            if(evt._overlap !== undefined){
                var colWidth = 100 / (overlapCols[dt]+1),
                    evtWidth = 100 - (colWidth * evt._overlap);
                    
                evt._width = colWidth;
                evt._left = colWidth * evt._overcol;
            }
            var markup = this.getEventTemplate().apply(evt),
                target = this.id + '-day-col-' + Ext.Date.format(evts[i].date, 'Ymd');
                
            Ext.core.DomHelper.append(target, markup);
        }
        
        this.fireEvent('eventsrendered', this);
    },

    // private
    getDayEl: function(dt) {
        return Ext.get(this.getDayId(dt));
    },

    // private
    getDayId: function(dt) {
        if (Ext.isDate(dt)) {
            dt = Ext.Date.format(dt, 'Ymd');
        }
        return this.id + this.dayColumnElIdDelimiter + dt;
    },

    // private
    getDaySize: function() {
        var box = this.el.down('.ext-cal-day-col-inner').getBox();
        return {
            height: box.height,
            width: box.width
        };
    },

    // private
    getDayAt: function(x, y) {
        var xoffset = this.el.down('.ext-cal-day-times').getWidth(),
            viewBox = this.el.getBox(),
            daySize = this.getDaySize(false),
            relX = x - viewBox.x - xoffset,
            dayIndex = Math.floor(relX / daySize.width),
            // clicked col index
            scroll = this.el.getScroll(),
            row = this.el.down('.ext-cal-bg-row'),
            // first avail row, just to calc size
            rowH = row.getHeight() / 2,
            // 30 minute increment since a row is 60 minutes
            relY = y - viewBox.y - rowH + scroll.top,
            rowIndex = Math.max(0, Math.ceil(relY / rowH)),
            mins = rowIndex * 30,
            dt = Ext.calendar.util.Date.add(this.viewStart, {days: dayIndex, minutes: mins}),
            el = this.getDayEl(dt),
            timeX = x;

        if (el) {
            timeX = el.getX();
        }

        return {
            date: dt,
            el: el,
            // this is the box for the specific time block in the day that was clicked on:
            timeBox: {
                x: timeX,
                y: (rowIndex * 21) + viewBox.y - scroll.top,
                width: daySize.width,
                height: rowH
            }
        };
    },

    // private
    onClick: function(e, t) {
        if (this.dragPending || Ext.calendar.view.DayBody.superclass.onClick.apply(this, arguments)) {
            // The superclass handled the click already so exit
            return;
        }
        if (e.getTarget('.ext-cal-day-times', 3) !== null) {
            // ignore clicks on the times-of-day gutter
            return;
        }
        var el = e.getTarget('td', 3);
        if (el) {
            if (el.id && el.id.indexOf(this.dayElIdDelimiter) > -1) {
                var dt = this.getDateFromId(el.id, this.dayElIdDelimiter);
                this.fireEvent('dayclick', this, Ext.Date.parseDate(dt, 'Ymd'), true, Ext.get(this.getDayId(dt, true)));
                return;
            }
        }
        var day = this.getDayAt(e.getX(), e.getY());
        if (day && day.date) {
            this.fireEvent('dayclick', this, day.date, false, null);
        }
    }
});


Ext.define('Ext.calendar.view.Day', {
    extend: 'Ext.container.Container',
    alias: 'widget.dayview',
    
    requires: [
        'Ext.calendar.view.AbstractCalendar',
        'Ext.calendar.view.DayHeader',
        'Ext.calendar.view.DayBody'
    ],
    
    
    showTime: true,
    
    showTodayText: true,
    
    todayText: 'Today',
    
    ddCreateEventText: 'Create event for {0}',
    
    ddMoveEventText: 'Move event to {0}',
    
    dayCount: 1,
    
    // private
    initComponent : function(){
        // rendering more than 7 days per view is not supported
        this.dayCount = this.dayCount > 7 ? 7 : this.dayCount;
        
        var cfg = Ext.apply({}, this.initialConfig);
        cfg.showTime = this.showTime;
        cfg.showTodatText = this.showTodayText;
        cfg.todayText = this.todayText;
        cfg.dayCount = this.dayCount;
        cfg.weekCount = 1; 
        
        var header = Ext.applyIf({
            xtype: 'dayheaderview',
            id: this.id+'-hd'
        }, cfg);
        
        var body = Ext.applyIf({
            xtype: 'daybodyview',
            id: this.id+'-bd'
        }, cfg);
        
        this.items = [header, body];
        this.addCls('ext-cal-dayview ext-cal-ct');
        
        this.callParent(arguments);
    },
    
    // private
    afterRender : function(){
        this.callParent(arguments);
        
        this.header = Ext.getCmp(this.id+'-hd');
        this.body = Ext.getCmp(this.id+'-bd');
        this.body.on('eventsrendered', this.forceSize, this);
    },
    
    // private
    refresh : function(){
        this.header.refresh();
        this.body.refresh();
    },
    
    // private
    forceSize: function(){
        // The defer call is mainly for good ol' IE, but it doesn't hurt in
        // general to make sure that the window resize is good and done first
        // so that we can properly calculate sizes.
        Ext.defer(function(){
            var ct = this.el.up('.x-panel-body'),
                hd = this.el.down('.ext-cal-day-header'),
                h = ct.getHeight() - hd.getHeight();
            
            this.el.down('.ext-cal-body-ct').setHeight(h);
        }, 10, this);
    },
    
    // private
    onResize : function(){
        this.callParent(arguments);
        this.forceSize();
    },
    
    // private
    getViewBounds : function(){
        return this.header.getViewBounds();
    },
    
    
    getStartDate : function(){
        return this.header.getStartDate();
    },

    
    setStartDate: function(dt){
        this.header.setStartDate(dt, true, true);
        this.body.setStartDate(dt, true, false);
    },

    // private
    renderItems: function(){
        this.header.renderItems();
        this.body.renderItems();
    },
    
    
    isToday : function(){
        return this.header.isToday();
    },
    
    
    moveTo : function(dt, noRefresh){
        this.header.moveTo(dt, noRefresh, true);
        return this.body.moveTo(dt, noRefresh);
    },
    
    
    moveNext : function(noRefresh){
        this.header.moveNext(noRefresh, true);
        return this.body.moveNext(noRefresh);
    },
    
    
    movePrev : function(noRefresh){
        this.header.movePrev(noRefresh, true);
        return this.body.movePrev(noRefresh);
    },

    
    moveDays : function(value, noRefresh){
        this.header.moveDays(value, noRefresh, true);
        return this.body.moveDays(value, noRefresh);
    },
    
    
    moveToday : function(noRefresh){
        this.header.moveToday(noRefresh, true);
        return this.body.moveToday(noRefresh);
    }
});


Ext.define('Ext.calendar.view.Week', {
    extend: 'Ext.calendar.view.Day',
    alias: 'widget.weekview',
    
    
    dayCount: 7
});


Ext.define('Ext.calendar.CalendarPanel', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.calendarpanel',
    
    requires: [
        'Ext.layout.container.Card',
        'Ext.calendar.view.Day',
        'Ext.calendar.view.Week',
        'Ext.calendar.view.Month',
        'Ext.calendar.form.EventDetails'
    ],
    
    
    showDayView: true,
    
    showWeekView: true,
    
    showMonthView: true,
    
    showNavBar: true,
    
    todayText: 'Today',
    
    showTodayText: true,
    
    showTime: true,
    
    dayText: 'Day',
    
    weekText: 'Week',
    
    monthText: 'Month',

    // private
    layoutConfig: {
        layoutOnCardChange: true,
        deferredRender: true
    },

    // private property
    startDate: new Date(),

    // private
    initComponent: function() {
        this.tbar = {
            cls: 'ext-cal-toolbar',
            border: true,
            items: ['->',{
                id: this.id + '-tb-prev',
                handler: this.onPrevClick,
                scope: this,
                iconCls: 'x-tbar-page-prev'
            }]
        };
		
		if (this.eventStore) {
			this.eventStore = Ext.data.StoreManager.lookup(this.eventStore); 
		}
		
		if (this.calendarStore) {
			this.calendarStore = Ext.data.StoreManager.lookup(this.calendarStore); 
		}

        this.viewCount = 0;

        if (this.showDayView) {
            this.tbar.items.push({
                id: this.id + '-tb-day',
                text: this.dayText,
                handler: this.onDayClick,
                scope: this,
                toggleGroup: 'tb-views'
            });
            this.viewCount++;
        }
        if (this.showWeekView) {
            this.tbar.items.push({
                id: this.id + '-tb-week',
                text: this.weekText,
                handler: this.onWeekClick,
                scope: this,
                toggleGroup: 'tb-views'
            });
            this.viewCount++;
        }
        if (this.showMonthView || this.viewCount == 0) {
            this.tbar.items.push({
                id: this.id + '-tb-month',
                text: this.monthText,
                handler: this.onMonthClick,
                scope: this,
                toggleGroup: 'tb-views'
            });
            this.viewCount++;
            this.showMonthView = true;
        }
        this.tbar.items.push({
            id: this.id + '-tb-next',
            handler: this.onNextClick,
            scope: this,
            iconCls: 'x-tbar-page-next'
        });
        this.tbar.items.push('->');

        var idx = this.viewCount - 1;
        this.activeItem = this.activeItem === undefined ? idx: (this.activeItem > idx ? idx: this.activeItem);

        if (this.showNavBar === false) {
            delete this.tbar;
            this.addCls('x-calendar-nonav');
        }

        this.callParent();

        this.addEvents({
            
            eventadd: true,
            
            eventupdate: true,
            
            eventdelete: true,
            
            eventcancel: true,
            
            viewchange: true

            //
            // NOTE: CalendarPanel also relays the following events from contained views as if they originated from this:
            //
            
            
            
            
            
            
            
            
            
            
        });

        this.layout = 'card';
        // do not allow override
        if (this.showDayView) {
            var day = Ext.apply({
                xtype: 'dayview',
                title: this.dayText,
                showToday: this.showToday,
                showTodayText: this.showTodayText,
                showTime: this.showTime
            },
            this.dayViewCfg);

            day.id = this.id + '-day';
            day.store = day.store || this.eventStore;
            this.initEventRelay(day);
            this.add(day);
        }
        if (this.showWeekView) {
            var wk = Ext.applyIf({
                xtype: 'weekview',
                title: this.weekText,
                showToday: this.showToday,
                showTodayText: this.showTodayText,
                showTime: this.showTime
            },
            this.weekViewCfg);

            wk.id = this.id + '-week';
            wk.store = wk.store || this.eventStore;
            this.initEventRelay(wk);
            this.add(wk);
        }
        if (this.showMonthView) {
            var month = Ext.applyIf({
                xtype: 'monthview',
                title: this.monthText,
                showToday: this.showToday,
                showTodayText: this.showTodayText,
                showTime: this.showTime
            },
            this.monthViewCfg);

            Ext.applyIf(month.listeners, {
                'weekclick': {
                    fn: function(vw, dt) {
                        this.showWeek(dt);
                    },
                    scope: this
                }
            });

            month.id = this.id + '-month';
            month.store = month.store || this.eventStore;
            this.initEventRelay(month);
            this.add(month);
        }
		
		this.on("afterlayout", function(){
			var view = this.layout.getActiveItem();
			view.setStartDate(view.startDate || new Date(), false, true); 
		}, this, {single:true});

        this.add(Ext.applyIf({
            xtype: 'eventeditform',
            id: this.id + '-edit',
            calendarStore: this.calendarStore,
            listeners: {
                'eventadd': {
                    scope: this,
                    fn: this.onEventAdd
                },
                'eventupdate': {
                    scope: this,
                    fn: this.onEventUpdate
                },
                'eventdelete': {
                    scope: this,
                    fn: this.onEventDelete
                },
                'eventcancel': {
                    scope: this,
                    fn: this.onEventCancel
                }
            }
        },
        this.editViewCfg));
    },

    // private
    initEventRelay: function(cfg) {
        cfg.listeners = cfg.listeners || {};
        cfg.listeners.afterrender = {
            fn: function(c) {
                // relay the view events so that app code only has to handle them in one place
                this.relayEvents(c, ['eventsrendered', 'eventclick', 'eventover', 'eventout', 'dayclick',
                'eventmove', 'datechange', 'rangeselect', 'eventdelete', 'eventresize', 'initdrag']);
            },
            scope: this,
            single: true
        };
    },

    // private
    afterRender: function() {
        this.callParent(arguments);
        
        this.body.addCls('x-cal-body');
        
        Ext.defer(function() {
            this.updateNavState();
            this.fireViewChange();
        }, 10, this);
    },

    // private
    onLayout: function() {
        this.callParent();
        if (!this.navInitComplete) {
            this.updateNavState();
            this.navInitComplete = true;
        }
    },

    // private
    onEventAdd: function(form, rec) {
        rec.data[Ext.calendar.data.EventMappings.IsNew.name] = false;
        this.hideEditForm();
        this.eventStore.add(rec);
        this.eventStore.sync();
        this.fireEvent('eventadd', this, rec);
    },

    // private
    onEventUpdate: function(form, rec) {
        this.hideEditForm();
        rec.commit();
        this.eventStore.sync();
        this.fireEvent('eventupdate', this, rec);
    },

    // private
    onEventDelete: function(form, rec) {
        this.hideEditForm();
        this.eventStore.remove(rec);
        this.eventStore.sync();
        this.fireEvent('eventdelete', this, rec);
    },

    // private
    onEventCancel: function(form, rec) {
        this.hideEditForm();
        this.fireEvent('eventcancel', this, rec);
    },

    
    showEditForm: function(rec) {
        this.preEditView = this.layout.getActiveItem().id;
        this.setActiveView(this.id + '-edit');
        this.layout.getActiveItem().loadRecord(rec);
        return this;
    },

    
    hideEditForm: function() {
        if (this.preEditView) {
            this.setActiveView(this.preEditView);
            delete this.preEditView;
        }
        return this;
    },

    // private
    setActiveView: function(id){
        var l = this.layout,
            tb = this.getDockedItems('toolbar')[0];
        
        // show/hide the toolbar first so that the layout will calculate the correct item size
        if (tb) {
            tb[id === this.id+'-edit' ? 'hide' : 'show']();
        }
        
        l.setActiveItem(id);
        this.doComponentLayout();
        this.activeView = l.getActiveItem();
        
        if(id !== this.id+'-edit'){
           if(id !== this.preEditView){
                l.activeItem.setStartDate(this.startDate, true, true);
            }
           this.updateNavState();
        }
        this.fireViewChange();
    },

    // private
    fireViewChange: function() {
        if (this.layout && this.layout.getActiveItem) {
            var view = this.layout.getActiveItem();
            if (view && view.getViewBounds) {
                var vb = view.getViewBounds();
                var info = {
                    activeDate: view.getStartDate(),
                    viewStart: vb.start,
                    viewEnd: vb.end
                };
            };
            this.fireEvent('viewchange', this, view, info);
        }
    },

    // private
    updateNavState: function() {
        if (this.showNavBar !== false) {
            var item = this.layout.activeItem,
                suffix = item.id.split(this.id + '-')[1],
                btn = Ext.getCmp(this.id + '-tb-' + suffix);

            if (btn) {
                btn.toggle(true);
            }
        }
    },

    
    setStartDate: function(dt) {
        this.layout.activeItem.setStartDate(dt, true);
        this.updateNavState();
        this.fireViewChange();
    },

    // private
    showWeek: function(dt) {
        this.setActiveView(this.id + '-week');
        this.setStartDate(dt);
    },

    // private
    onPrevClick: function() {
        this.startDate = this.layout.activeItem.movePrev();
        this.updateNavState();
        this.fireViewChange();
    },

    // private
    onNextClick: function() {
        this.startDate = this.layout.activeItem.moveNext();
        this.updateNavState();
        this.fireViewChange();
    },

    // private
    onDayClick: function() {
        this.setActiveView(this.id + '-day');
    },

    // private
    onWeekClick: function() {
        this.setActiveView(this.id + '-week');
    },

    // private
    onMonthClick: function() {
        this.setActiveView(this.id + '-month');
    },

    
    getActiveView: function() {
        return this.layout.activeItem;
    }
});



Ext.define('Ext.ux.Spotlight', {
    
    baseCls: 'x-spotlight',

    
    animate: true,

    
    duration: 250,

    
    easing: null,

    
    active: false,
    
    constructor: function(config){
        Ext.apply(this, config);
    },

    
    createElements: function() {
        var me = this,
            baseCls = me.baseCls,
            body = Ext.getBody();

        me.right = body.createChild({
            cls: baseCls
        });
        me.left = body.createChild({
            cls: baseCls
        });
        me.top = body.createChild({
            cls: baseCls
        });
        me.bottom = body.createChild({
            cls: baseCls
        });

        me.all = Ext.create('Ext.CompositeElement', [me.right, me.left, me.top, me.bottom]);
    },

    
    show: function(el, callback, scope) {
        var me = this;
        
        //get the target element
        me.el = Ext.net.getEl(el);

        //create the elements if they don't already exist
        if (!me.right) {
            me.createElements();
        }

        if (!me.active) {
            //if the spotlight is not active, show it
            me.all.setDisplayed('');
            me.active = true;
            Ext.EventManager.onWindowResize(me.syncSize, me);
            me.applyBounds(me.animate, false);
        } else {
            //if the spotlight is currently active, just move it
            me.applyBounds(false, false);
        }
    },

    
    hide: function(callback, scope) {
        var me = this;
        
        Ext.EventManager.removeResizeListener(me.syncSize, me);
        me.applyBounds(me.animate, true);
        me.active = false;
    },

    
    syncSize: function() {
        this.applyBounds(false, false);
    },

    
    applyBounds: function(animate, reverse) {
        var me = this,
            box = me.el.getBox(),
            //get the current view width and height
            viewWidth = Ext.Element.getViewWidth(true),
            viewHeight = Ext.Element.getViewHeight(true),
            i = 0,
            config = false,
            from, to, clone;
            
        //where the element should start (if animation)
        from = {
            right: {
                x: box.right,
                y: viewHeight,
                width: (viewWidth - box.right),
                height: 0
            },
            left: {
                x: 0,
                y: 0,
                width: box.x,
                height: 0
            },
            top: {
                x: viewWidth,
                y: 0,
                width: 0,
                height: box.y
            },
            bottom: {
                x: 0,
                y: (box.y + box.height),
                width: 0,
                height: (viewHeight - (box.y + box.height)) + 'px'
            }
        };

        //where the element needs to finish
        to = {
            right: {
                x: box.right,
                y: box.y,
                width: (viewWidth - box.right) + 'px',
                height: (viewHeight - box.y) + 'px'
            },
            left: {
                x: 0,
                y: 0,
                width: box.x + 'px',
                height: (box.y + box.height) + 'px'
            },
            top: {
                x: box.x,
                y: 0,
                width: (viewWidth - box.x) + 'px',
                height: box.y + 'px'
            },
            bottom: {
                x: 0,
                y: (box.y + box.height),
                width: (box.x + box.width) + 'px',
                height: (viewHeight - (box.y + box.height)) + 'px'
            }
        };

        //reverse the objects
        if (reverse) {
            clone = Ext.clone(from);
            from = to;
            to = clone;
        }

        if (animate) {
            Ext.Array.forEach(['right', 'left', 'top', 'bottom'], function(side) {
                me[side].setBox(from[side]);
                me[side].animate({
                    duration: me.duration,
                    easing: me.easing,
                    to: to[side]
                });
            },
            this);
        } else {
            Ext.Array.forEach(['right', 'left', 'top', 'bottom'], function(side) {
                me[side].setBox(Ext.apply(from[side], to[side]));
                me[side].repaint();
            },
            this);
        }
    },

    
    destroy: function() {
        var me = this;
        
        Ext.destroy(me.right, me.left, me.top, me.bottom);
        delete me.el;
        delete me.all;
    }
});

Ext.define("Ext.net.TabStrip", {
    extend      : "Ext.tab.Bar",
    alias       : "widget.tabstrip",
    plain       : true,
    autoGrow    : true,    
    tabPosition : "top",

    getActiveTabField : function () {
        if (!this.activeTabField && this.initialConfig && Ext.isDefined(this.initialConfig.id)) {
            this.activeTabField = new Ext.form.Hidden({                 
                name  : this.id, 
                value : this.id + ":" + (this.activeTab || 0)
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.activeTabField);	
        }

        return this.activeTabField;
    },

    initComponent : function () {
        this.dock = this.tabPosition;
        this.orientation = (this.tabPosition == "top" || this.tabPosition == "bottom") ? "horizontal" : "vertical";

        this.addEvents(
            'beforetabchange',
            'tabchange',
            'beforetabclose',
            'tabclose'
        );

        this.callParent(arguments);           

        this.addCls("x-tab-strip");
        
        if(this.autoGrow) {
            if (this.orientation == "horizontal" && this.initialConfig.width || this.initialConfig.flex) {
                this.autoGrow = false;
            }

            if (this.orientation == "vertical") {
                if(this.initialConfig.height || this.initialConfig.flex) {
                    this.autoGrow = false;
                }   
                if(!this.initialConfig.width && this.tabPosition == "left") {
                    this.width = 23;
                }
            }
        }

        this.on("beforetabchange", function (tabStrip, newTab) {
            newTab = newTab || {};
            var field = this.getActiveTabField();

            if (field) {
                field.setValue(newTab.id + ':' + this.items.indexOf(newTab));
            }
        }, this);
    
        this.on("render", function () {
            var field = this.getActiveTabField();
        
		    if (field) {
                field.render(this.el.parent() || this.el);
            }
        }, this);

        this.on("afterlayout", this.syncSize, this, {buffer: 10});
    },

    onAdd: function(tab) {                
        tab.tabBar = this;
        this.callParent(arguments);
    },

    afterRender : function () {
        this.callParent(arguments);

        var activeTab = this.getComponent(this.activeTab || 0);
        delete this.activeTab;
        this.setActiveTab(activeTab);     
    },

    syncSize : function () {
        if (!this.autoGrow || !this.rendered || this.syncing) {
            return;
        }
        Ext.suspendLayouts();
        var horz = this.orientation == "horizontal",
            size = 0;
        
        this.items.each(function(item){
            size += (horz ? item.getWidth() : item.getHeight()) + 2;
        });
            
        this.syncing = true;
        if (this._lastSize != (size+2)) {
            this._lastSize = size+2;
            this[horz ? "setWidth" : "setHeight"](size+2);
        }
        
        Ext.resumeLayouts();
        this.syncing = false;
    },

    getActiveTab: function() {
        var me = this,
            result = me.getComponent(me.activeTab);

        if (result && me.items.indexOf(result) != -1) {
            me.activeTab = result;
        } else {
            me.activeTab = null;
        }

        return me.activeTab;
    }, 

    setActiveTab: function(tab) {
        tab = this.getComponent(tab);
        if (tab) {
            var previous = this.activeTab;

            if (previous && previous !== tab && this.fireEvent('beforetabchange', this, tab, previous) === false) {
                return false;
            }

            if (tab && tab.actionItem) {
                var cmp = Ext.getCmp(tab.actionItem),
                    hideCmp,
                    hideEl,
                    hideCls;
                    
                var hideFunc = function () {
                    this.items.each(function (tabItem) {
                        if (tabItem != tab && tabItem.actionItem) {
                            hideCmp = Ext.getCmp(tabItem.actionItem);
                            
                            if (hideCmp) {
                                hideCmp.hideMode = tabItem.hideMode;
                                hideCmp.hide();
                            } else {
                                hideEl = Ext.net.getEl(tabItem.actionItem);
                                
                                if (hideEl) {
                                    switch (tabItem.hideMode) {
                                        case "display" :
                                            hideCls = "x-hide-display";
                                            break;
                                        case "offsets" :
                                            hideCls = "x-hide-offsets";
                                            break;
                                        case "visibility" :
                                            hideCls = "x-hide-visibility";
                                            break;
                                        default :
                                            hideCls = "x-hide-display";
                                            break;
                                    }
                                    
                                    hideEl.addCls(hideCls);
                                }
                            }
                        }
                    }, this);
                };
                
                if (cmp) {                
                    if (cmp.ownerCt && cmp.ownerCt.layout && cmp.ownerCt.layout.setActiveItem) {
                        if(cmp.rendered){
                            cmp.ownerCt.layout.setActiveItem(cmp);
                        }
                        else{
                            cmp.activeItem = this.items.indexOf(tab);
                        }
                    } else {
                        hideFunc.call(this);                        
                        cmp.show();
                    }
                } else {
                    var el = Ext.net.getEl(tab.actionItem);
                    
                    if (el) {
                        hideFunc.call(this);                        
                        el.removeCls(["x-hidden", "x-hide-display", "x-hide-visibility", "x-hide-offsets"]);
                    }
                }
            }


            this.callParent([tab]);
            this.activeTab = tab;

            if (this.actionContainer) {
                this.setActiveCard(this.items.indexOf(tab));
            }

            if (previous && previous !== tab) {
                this.fireEvent('tabchange', this, tab, previous);
            }
        }
    },

    setActiveCard : function (index) {
        var cmp = Ext.getCmp(this.actionContainer);
        
        if (cmp.getLayout().setActiveItem && cmp.rendered) {
            cmp.getLayout().setActiveItem(index);
        } else {
            cmp.activeItem = index;
        }
    },

    closeTab: function(tab) {
        var nextTab;

        if (tab && tab.fireEvent('beforetabclose', this, tab) === false) {
            return false;
        }

        if (tab.active && this.items.getCount() > 1) {
            if(this.previousTab && this.previousTab.id != tab.id){
                nextTab = this.previousTab;
            }
            else{
                nextTab = tab.next('tab') || this.items.first();
            }
            this.setActiveTab(nextTab);
        }
                
        this.fireEvent('tabclose', this, tab);
        this.remove(tab);

        if (nextTab) {
            nextTab.focus();
        }
    },

    setTabText : function (tab, text) {
        tab = this.getComponent(tab);
        tab.setText(text);
        this.doLayout();
    },
    
    setTabHidden : function (tab, hidden) {
        tab = this.getComponent(tab);
        tab.hidden = hidden;
        hidden ? tab.hide() : tab.show();
    },
    
    setTabIconCls : function (tab, iconCls) {
        tab = this.getComponent(tab);
        tab.setIconCls(iconCls);
        this.doLayout();
    },

    setTabDisabled : function (tab, disabled) {
        tab = this.getComponent(tab);
        tab.setDisabled(disabled);
    },

    setTabTooltip : function (tab, tooltip) {
        tab = this.getComponent(tab);
        tab.setTooltip(tooltip);
    }
});

Ext.define('Ext.ux.FieldReplicator', {
    singleton: true,

    init: function(field) {
        // Assign the field an id grouping it with fields cloned from it. If it already
        // has an id that means it is itself a clone.
        if (!field.replicatorId) {
            field.replicatorId = Ext.id();
        }

        field.on('blur', this.onBlur, this);
    },

    onBlur: function(field) {
        var ownerCt = field.ownerCt,
            replicatorId = field.replicatorId,
            isEmpty = Ext.isEmpty(field.getRawValue()),
            siblings = ownerCt.query('[replicatorId=' + replicatorId + ']'),
            isLastInGroup = siblings[siblings.length - 1] === field,
            clone, idx;

        // If a field before the final one was blanked out, remove it
        if (isEmpty && !isLastInGroup) {
            Ext.Function.defer(field.destroy, 10, field); //delay to allow tab key to move focus first
        }
        // If the field is the last in the list and has a value, add a cloned field after it
        else if(!isEmpty && isLastInGroup) {
            if (field.onReplicate) {
                field.onReplicate();
            }
            clone = field.cloneConfig({replicatorId: replicatorId});
            idx = ownerCt.items.indexOf(field);
            ownerCt.add(idx + 1, clone);
        }
    }

});


Ext.define('Ext.ux.ProgressBarPager', {

    requires: ['Ext.ProgressBar'],
    
    width   : 225,
    
    defaultText    : 'Loading...',
    
    defaultAnimCfg : {
		duration: 1000,
		easing: 'bounceOut'	
	},	
    
    constructor : function(config) {
        if (config) {
            Ext.apply(this, config);
        }
    },
    //public
    init : function (parent) {
        var displayItem;
        if(parent.displayInfo) {
            this.parent = parent;

            displayItem = parent.child("#displayItem");
            if (displayItem) {
                parent.remove(displayItem, true);
            }

            this.progressBar = Ext.create('Ext.ProgressBar', {
                text    : this.defaultText,
                width   : this.width,
                animate : this.defaultAnimCfg,
                style: {
                    cursor: 'pointer'
                },
                listeners: {
                    el: {
                        scope: this,
                        click: this.handleProgressBarClick
                    }
                }
            });

            parent.displayItem = this.progressBar;

            parent.add(parent.displayItem);
            Ext.apply(parent, this.parentOverrides);
        }
    },
    // private
    // This method handles the click for the progress bar
    handleProgressBarClick : function(e){
        var parent = this.parent,
            displayItem = parent.displayItem,
            box = this.progressBar.getBox(),
            xy = e.getXY(),
            position = xy[0]- box.x,
            pages = Math.ceil(parent.store.getTotalCount()/parent.store.pageSize),
            newPage = Math.max(Math.ceil(position / (displayItem.width / pages)), 1);

        parent.store.loadPage(newPage);
    },

    // private, overriddes
    parentOverrides  : {
        // private
        // This method updates the information via the progress bar.
        updateInfo : function(){
            if(this.displayItem){
                var count = this.store.getCount(),
                    pageData = this.getPageData(),
                    message = count === 0 ?
                    this.emptyMsg :
                    Ext.String.format(
                        this.displayMsg,
                        pageData.fromRecord, pageData.toRecord, this.store.getTotalCount()
                    ),
                    percentage = pageData.pageCount > 0 ? (pageData.currentPage / pageData.pageCount) : 0;

                this.displayItem.updateProgress(percentage, message, this.animate || this.defaultAnimConfig);
            }
        }
    }
});




Ext.ns('Ext.ux');

Ext.define('Ext.ux.TabScrollerMenu', {
    alias: 'plugin.tabscrollermenu',

    requires: ['Ext.menu.Menu'],

    
    pageSize : 10,
    
    maxText : 15,
    
    menuPrefixText: 'Items',
    constructor: function(config) {
        Ext.apply(this, config);
    },
    //private
    init : function(tabPanel) {
        var me = this;

        me.tabPanel = tabPanel;

        if (!me.tabPanel.tabBar) {
            me.tabPanel.tabBar = me.tabPanel;
        }

        tabPanel.on({
            render : function () {
                me.tabBar = me.tabPanel.tabBar;
                me.layout = me.tabBar.layout;
                me.layout.overflowHandler.handleOverflow = Ext.Function.bind(me.showButton, me);
                me.layout.overflowHandler.clearOverflow = Ext.Function.createSequence(me.layout.overflowHandler.clearOverflow, me.hideButton, me);
            },
            destroy: me.destroy,
            scope: me,
            single: true
        });
    },

    showButton : function () {
        var me = this,
            result = Ext.getClass(me.layout.overflowHandler).prototype.handleOverflow.apply(me.layout.overflowHandler, arguments),
            button = me.menuButton;

        if (me.tabPanel.items.getCount() > 1) {
            if (!button) {
                button = me.menuButton = me.tabBar.body.createChild({
                    cls: Ext.baseCSSPrefix + 'tab-tabmenu-right'
                }, me.tabBar.body.child('.' + Ext.baseCSSPrefix + 'box-scroller-right'));
                button.addClsOnOver(Ext.baseCSSPrefix + 'tab-tabmenu-over');
                button.on('click', me.showTabsMenu, me);
            }
            button.setVisibilityMode(Ext.dom.Element.DISPLAY);
            button.show();
            result.reservedSpace += button.getWidth();
        } else {
            me.hideButton();
        }
        return result;
    },

    hideButton : function () {
        var me = this;
        if (me.menuButton) {
            me.menuButton.hide();
        }
    },

    
    getPageSize : function () {
        return this.pageSize;
    },
    
    setPageSize : function (pageSize) {
        this.pageSize = pageSize;
    },
    
    getMaxText : function () {
        return this.maxText;
    },
    
    setMaxText : function (t) {
        this.maxText = t;
    },
    
    getMenuPrefixText : function () {
        return this.menuPrefixText;
    },
    
    setMenuPrefixText : function (t) {
        this.menuPrefixText = t;
    },

    showTabsMenu : function (e) {
        var me = this;

        if (me.tabsMenu) {
            me.tabsMenu.removeAll();
        } else {
            me.tabsMenu = new Ext.menu.Menu();
        }

        me.generateTabMenuItems();

        var target = Ext.get(e.getTarget()),
            xy = target.getXY();

        //Y param + 24 pixels
        xy[1] += 24;

        me.tabsMenu.showAt(xy);
    },

    // private
    generateTabMenuItems: function() {
        var me = this,
            tabPanel = me.tabPanel,
            curActive = tabPanel.getActiveTab(),
            allItems = tabPanel.items.getRange(),
            pageSize = me.getPageSize(),
            tabsMenu = me.tabsMenu,
            totalItems, numSubMenus, remainder,
            i, curPage, menuItems, x, item, start, index;
            
        tabsMenu.suspendLayouts();
        allItems = Ext.Array.filter(allItems, function(item){
            if (item.id == curActive.id) {
                return false;
            }
            return item.hidden ? !!item.hiddenByLayout : true;
        });
        totalItems = allItems.length;
        numSubMenus = Math.floor(totalItems / pageSize);
        remainder = totalItems % pageSize;

        if (totalItems > pageSize) {

            // Loop through all of the items and create submenus in chunks of 10
            for (i = 0; i < numSubMenus; i++) {
                curPage = (i + 1) * pageSize;
                menuItems = [];

                for (x = 0; x < pageSize; x++) {
                    index = x + curPage - pageSize;
                    item = allItems[index];
                    menuItems.push(me.autoGenMenuItem(item));
                }

                tabsMenu.add({
                    text: me.getMenuPrefixText() + ' ' + (curPage - pageSize + 1) + ' - ' + curPage,
                    menu: menuItems
                });
            }
            // remaining items
            if (remainder > 0) {
                start = numSubMenus * pageSize;
                menuItems = [];
                for (i = start; i < totalItems; i++) {
                    item = allItems[i];
                    menuItems.push(me.autoGenMenuItem(item));
                }

                me.tabsMenu.add({
                    text: me.menuPrefixText + ' ' + (start + 1) + ' - ' + (start + menuItems.length),
                    menu: menuItems
                });

            }
        } else {
            for (i = 0; i < totalItems; ++i) {
                tabsMenu.add(me.autoGenMenuItem(allItems[i]));
            }
        }
        tabsMenu.resumeLayouts(true);
    },

    // private
    autoGenMenuItem : function (item) {
        var maxText = this.getMaxText(),
            text = Ext.util.Format.ellipsis(item.title || item.text, maxText);

        return {
            text      : text,
            handler   : this.showTabFromMenu,
            scope     : this,
            disabled  : item.disabled,
            tabToShow : item,
            iconCls   : item.iconCls
        };
    },

    // private
    showTabFromMenu : function (menuItem) {
        this.tabPanel.setActiveTab(menuItem.tabToShow);
    },
    
    destroy: function(){
        Ext.destroy(this.tabsMenu, this.menuButton);       
    }
});




Ext.define('Ext.ux.statusbar.StatusBar', {
    extend: 'Ext.toolbar.Toolbar',
    alternateClassName: 'Ext.ux.StatusBar',
    alias: 'widget.statusbar',
    requires: ['Ext.toolbar.TextItem'],
    
    
    
    
    

    
    cls : 'x-statusbar',
    
    busyIconCls : 'x-status-busy',
    
    busyText : 'Loading...',
    
    autoClear : 5000,

    
    emptyText : '&nbsp;',

    // private
    activeThreadId : 0,

    // private
    initComponent : function(){
        var right = this.statusAlign === 'right';

        this.callParent(arguments);
    
        this.currIconCls = this.iconCls || this.defaultIconCls;
        this.statusEl = Ext.create('Ext.toolbar.TextItem', {
            cls: 'x-status-text ' + (this.currIconCls || ''),
            text: this.text || this.defaultText || ''
        });

        if (right) {
            this.cls += ' x-status-right';
            this.add('->');
            this.add(this.statusEl);
        } else {
            this.insert(0, this.statusEl);
            this.insert(1, '->');
        }
        //this.height = 27;
    },

    
    setStatus : function(o) {
        if (!this.statusEl.rendered) {
            this.statusEl.on("render", function () {
                this.setStatus(o);
            }, this);
            return this;
        }
	
	    o = o || {};

        Ext.suspendLayouts();

        if (Ext.isString(o)) {
            o = {text:o};
        }
        if (o.text !== undefined) {
            this.setText(o.text);
        }
        if (o.iconCls !== undefined) {
            this.setIcon(o.iconCls);
        }
        else if(o.clearIcon == true){
            this.setIcon("");
        }

        if (o.clear) {
            var c = o.clear,
                wait = this.autoClear,
                defaults = {useDefaults: true, anim: true};

            if (Ext.isObject(c)) {
                c = Ext.applyIf(c, defaults);
                if (c.wait) {
                    wait = c.wait;
                }
            } else if (Ext.isNumber(c)) {
                wait = c;
                c = defaults;
            } else if (Ext.isBoolean(c)) {
                c = defaults;
            }

            c.threadId = this.activeThreadId;
            Ext.defer(this.clearStatus, wait, this, [c]);
        }
        Ext.resumeLayouts(true);
        return this;
    },

    
    clearStatus : function(o) {
	if (!this.statusEl.rendered) {
            this.statusEl.on("render", function () {
                this.clearStatus(o);
            }, this);
            return this;
        }
        o = o || {};

        if (o.threadId && o.threadId !== this.activeThreadId) {
            // this means the current call was made internally, but a newer
            // thread has set a message since this call was deferred.  Since
            // we don't want to overwrite a newer message just ignore.
            return this;
        }

        var text = o.useDefaults ? this.defaultText : this.emptyText,
            iconCls = o.useDefaults ? (this.defaultIconCls ? this.defaultIconCls : '') : '';

        if (o.anim) {
            // animate the statusEl Ext.Element
            this.statusEl.el.puff({
                remove: false,
                useDisplay: true,
                scope: this,
                callback: function(){
                    this.statusEl.el.show();
                    this.setStatus({
                     text: text,
                     iconCls: iconCls
                    });
                }
            });
        } else {            
             this.setStatus({
                 text: text,
                 iconCls: iconCls
             });
        }
        
        return this;
    },

    
    setText : function(text){
        this.activeThreadId++;
        this.text = text || '';
        if (this.rendered) {
            this.statusEl.setText(this.text);
        }
        return this;
    },

    
    getText : function(){
        return this.text;
    },

    
    setIcon : function(cls){
        this.activeThreadId++;
        cls = cls || '';

        if (this.rendered) {
	        if (this.currIconCls) {
	            this.statusEl.removeCls("x-status-busy-base");
	            this.statusEl.removeCls(this.currIconCls.split(" "));
	            this.currIconCls = null;
	        }
	        if (cls.length > 0) {
	            this.statusEl.addCls("x-status-busy-base " + cls);
	            this.currIconCls = cls;
	        }
        } else {
            this.currIconCls = cls;
        }
        return this;
    },

    
    showBusy : function(o){
        if (Ext.isString(o)) {
            o = { text: o };
        }
        o = Ext.applyIf(o || {}, {
            text: this.busyText,
            iconCls: this.busyIconCls
        });
        return this.setStatus(o);
    }
});



Ext.define('Ext.ux.statusbar.ValidationStatus', {
    extend: 'Ext.Component', 
    requires: ['Ext.util.MixedCollection'],
    
    errorIconCls : 'x-status-error',
    
    errorListCls : 'x-status-error-list',
    
    validIconCls : 'x-status-valid',
    
    
    showText : 'The form has errors (click for details...)',
    
    hideText : 'Click again to hide the error list',
    
    submitText : 'Saving...',
    
    // private
    init : function(sb){
        sb.on('render', function(){
            this.statusBar = sb;
            this.monitor = true;
            this.errors = Ext.create('Ext.util.MixedCollection');
            this.listAlign = (sb.statusAlign === 'right' ? 'br-tr?' : 'bl-tl?');
            
            if (this.form) {
                this.formPanel = Ext.getCmp(this.form);
                this.basicForm = this.formPanel.getForm();
                this.startMonitoring();
                this.basicForm.on('beforeaction', function(f, action){
                    if(action.type === 'submit'){
                        // Ignore monitoring while submitting otherwise the field validation
                        // events cause the status message to reset too early
                        this.monitor = false;
                    }
                }, this);
                var startMonitor = function(){
                    this.monitor = true;
                };
                this.basicForm.on('actioncomplete', startMonitor, this);
                this.basicForm.on('actionfailed', startMonitor, this);
            }
        }, this, {single:true});
        sb.on({
            scope: this,
            afterlayout:{
                single: true,
                fn: function(){
                    // Grab the statusEl after the first layout.
                    sb.statusEl.getEl().on('click', this.onStatusClick, this, {buffer:200});
                } 
            }, 
            beforedestroy:{
                single: true,
                fn: this.onDestroy
            } 
        });
    },
    
    // private
    startMonitoring : function() {
        this.basicForm.getFields().each(function(f){
            f.on('validitychange', this.onFieldValidation, this);
        }, this);
    },
    
    // private
    stopMonitoring : function(){
        this.basicForm.getFields().each(function(f){
            f.un('validitychange', this.onFieldValidation, this);
        }, this);
    },
    
    // private
    onDestroy : function(){
        this.stopMonitoring();
        this.statusBar.statusEl.un('click', this.onStatusClick, this);
        this.callParent(arguments);
    },
    
    // private
    onFieldValidation : function(f, isValid){
        if (!this.monitor) {
            return false;
        }
        var msg = f.getErrors()[0];
        if (msg) {
            this.errors.add(f.id, {field:f, msg:msg});
        } else {
            this.errors.removeAtKey(f.id);
        }
        this.updateErrorList();
        if(this.errors.getCount() > 0) {
            if(this.statusBar.getText() !== this.showText){
                this.statusBar.statusEl.removeCls(["x-status-base-valid-icon", this.validIconCls]);
                this.statusBar.setStatus({ 
                    text    : this.showText, 
                    iconCls : "x-statusbar-base-error-icon " + this.errorIconCls 
                });
            }
        }else{
            this.statusBar.statusEl.removeCls(["x-statusbar-base-error-icon", this.errorIconCls]);
            this.statusBar.clearStatus().setIcon("x-status-base-valid-icon " + this.validIconCls);
        }
    },
    
    // private
    updateErrorList : function(){
        if(this.errors.getCount() > 0){
         var msg = '<ul>';
         this.errors.each(function(err){
             msg += ('<li id="x-err-'+ err.field.id +'"><a href="#">' + err.msg + '</a></li>');
         }, this);
         this.getMsgEl().update(msg+'</ul>');
        }else{
            this.getMsgEl().update('');
        }
        // reset msgEl size
        this.getMsgEl().setSize('auto', 'auto');
    },
    
    // private
    getMsgEl : function(){
        if(!this.msgEl){
            this.msgEl = Ext.DomHelper.append(Ext.getBody(), {
                cls: this.errorListCls
            }, true);
            this.msgEl.hide();
            this.msgEl.on('click', function(e){
                var t = e.getTarget('li', 10, true);
                if(t){
                    Ext.getCmp(t.id.split('x-err-')[1]).focus();
                    this.hideErrors();
                }
            }, this, {stopEvent:true}); // prevent anchor click navigation
        }
        return this.msgEl;
    },
    
    // private
    showErrors : function(){
        this.updateErrorList();
        this.getMsgEl().alignTo(this.statusBar.getEl(), this.listAlign).slideIn('b', {duration: 300, easing:'easeOut'});
        this.statusBar.setText(this.hideText);
        this.formPanel.el.on('click', this.hideErrors, this, {single:true}); // hide if the user clicks directly into the form
    },
    
    // private
    hideErrors : function(){
        var el = this.getMsgEl();
        if(el.isVisible()){
         el.slideOut('b', {duration: 300, easing:'easeIn'});
         this.statusBar.setText(this.showText);
        }
        this.formPanel.el.un('click', this.hideErrors, this);
    },
    
    // private
    onStatusClick : function(){
        if(this.getMsgEl().isVisible()){
            this.hideErrors();
        }else if(this.errors.getCount() > 0){
            this.showErrors();
        }
    }
});

Ext.define('Ext.ux.PreviewPlugin', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.preview',
    requires: ['Ext.grid.feature.RowBody', 'Ext.grid.feature.RowWrap'],
    
    // private, css class to use to hide the body
    hideBodyCls: 'x-grid-row-body-hidden',
    
    
    bodyField: '',
    
    
    previewExpanded: true,
    
    constructor: function(config) {
        this.callParent(arguments);
    },

    setCmp: function(grid) {
        this.callParent(arguments);
        
        var bodyField   = this.bodyField,
            hideBodyCls = this.hideBodyCls,
            features    = [{
                ftype: 'rowbody',
                getAdditionalData: function(data, idx, record, orig, view) {
                    var getAdditionalData = Ext.grid.feature.RowBody.prototype.getAdditionalData,
                        additionalData = {
                            rowBody: data[bodyField],
                            rowBodyCls: grid.previewExpanded ? '' : hideBodyCls
                        };
                        
                    if (getAdditionalData) {
                        Ext.apply(additionalData, getAdditionalData.apply(this, arguments));
                    }
                    return additionalData;
                }
            }, {
                ftype: 'rowwrap'
            }];
        
        grid.previewExpanded = this.previewExpanded;
        if (!grid.features) {
            grid.features = [];
        }
        grid.features = features.concat(grid.features);
    },

    
    
    toggleExpanded: function(expanded) {
        var view = this.getCmp();
        this.previewExpanded = view.previewExpanded = expanded;
        view.refresh();
    }
});


Ext.define('Ext.tab.TabCloseMenu', {
    alias: 'plugin.tabclosemenu',
    alternateClassName: 'Ext.ux.TabCloseMenu',

    mixins: {
        observable: 'Ext.util.Observable'
    },

    
    closeTabText: 'Close Tab',

    
    showCloseOthers: true,

    
    closeOthersTabsText: 'Close Other Tabs',

    
    showCloseAll: true,

    
    closeAllTabsText: 'Close All Tabs',

    
    extraItemsHead: null,

    
    extraItemsTail: null,

    //public
    constructor: function (config) {
        this.addEvents(
            'aftermenu',
            'beforemenu');

        this.mixins.observable.constructor.call(this, config);
    },

    init: function (tabpanel) {
        this.tabPanel = tabpanel;
        this.tabBar = tabpanel.down("tabbar");

        this.mon(this.tabPanel, {
            scope: this,
            afterlayout: this.onAfterLayout,
            single: true
        });
    },

    onAfterLayout: function () {
        this.mon(this.tabBar.el, {
            scope: this,
            contextmenu: this.onContextMenu,
            delegate: '.x-tab'
        });
    },

    onBeforeDestroy: function () {
        Ext.destroy(this.menu);
        this.callParent(arguments);
    },

    // private
    onContextMenu: function (event, target) {
        var me = this,
            menu = me.createMenu(),
            disableAll = true,
            disableOthers = true,
            tab = me.tabBar.getChildByElement(target),
            index = me.tabBar.items.indexOf(tab);

        me.item = me.tabPanel.getComponent(index);
        menu.child('*[text="' + me.closeTabText + '"]').setDisabled(!me.item.closable);

        if (me.showCloseAll || me.showCloseOthers) {
            me.tabPanel.items.each(function (item) {
                if (item.closable) {
                    disableAll = false;
                    if (item != me.item) {
                        disableOthers = false;
                        return false;
                    }
                }
                return true;
            });

            if (me.showCloseAll) {
                menu.child('*[text="' + me.closeAllTabsText + '"]').setDisabled(disableAll);
            }

            if (me.showCloseOthers) {
                menu.child('*[text="' + me.closeOthersTabsText + '"]').setDisabled(disableOthers);
            }
        }

        event.preventDefault();
        me.fireEvent('beforemenu', menu, me.item, me);

        menu.showAt(event.getXY());
    },

    createMenu: function () {
        var me = this;

        if (!me.menu) {
            var items = [{
                text: me.closeTabText,
                iconCls: this.closeTabIconCls,
                scope: me,
                handler: me.onClose
            }];

            if (me.showCloseAll || me.showCloseOthers) {
                items.push('-');
            }

            if (me.showCloseOthers) {
                items.push({
                    text: me.closeOthersTabsText,
                    iconCls: this.closeOtherTabsIconCls,
                    scope: me,
                    handler: me.onCloseOthers
                });
            }

            if (me.showCloseAll) {
                items.push({
                    text: me.closeAllTabsText,
                    iconCls: this.closeAllTabsIconCls,
                    scope: me,
                    handler: me.onCloseAll
                });
            }

            if (me.extraItemsHead) {
                items = me.extraItemsHead.concat(items);
            }

            if (me.extraItemsTail) {
                items = items.concat(me.extraItemsTail);
            }

            me.menu = Ext.create('Ext.menu.Menu', {
                items: items,
                listeners: {
                    hide: me.onHideMenu,
                    scope: me,
                    delay: 1
                }
            });
        }

        return me.menu;
    },

    onHideMenu: function () {
        var me = this;

        me.item = null;
        me.fireEvent('aftermenu', me.menu, me);
    },

    onClose: function () {
        this.tabPanel.closeTab(this.item);
    },

    onCloseOthers: function () {
        this.doClose(true);
    },

    onCloseAll: function () {
        this.doClose(false);
    },

    doClose: function (excludeActive) {
        var items = [];

        this.tabPanel.items.each(function (item) {
            if (item.closable) {
                if (!excludeActive || item != this.item) {
                    items.push(item);
                }
            }
        }, this);

        Ext.each(items, function (item) {
            this.tabPanel.closeTab(item);
        }, this);
    }
});

Ext.tab.TabCloseMenu.override(Ext.util.DirectObservable);


Ext.define("Ext.net.CapsLockDetector", {
    extend: "Ext.util.Observable",

    preventCapsLockChar : false,

    constructor : function (config) {
        this.addEvents("capslockon", "capslockoff");
        this.callParent(arguments);
    },
    
    init: function(field) {
        this.field = field;

        field.on({
            element:'inputEl',
            keypress : this.onKeyPress,
            scope : this
        });
    },

    onKeyPress : function (e) {
        // We need alphabetic characters to make a match.
        var character = String.fromCharCode(e.getCharCode());
        if(character.toUpperCase() === character.toLowerCase()) {
            return;
        }

        if((e.shiftKey && character.toLowerCase() === character) || (!e.shiftKey && character.toUpperCase() === character)) {
            if(!this.capslock){
                if(this.capsLockIndicatorIconCls) {
                    this.field.setIndicatorIconCls(this.capsLockIndicatorIconCls, true);
		            this.field.showIndicator();
                }

                if (this.capsLockIndicatorText) {
		            this.field.setIndicator(this.capsLockIndicatorText);
		        }

                if (this.capsLockIndicatorTip) {
		            this.field.setIndicatorTip(this.capsLockIndicatorTip);
		        }
                
                this.capslock = true;
                this.fireEvent("capslockon", this);
            }

            if(this.preventCapsLockChar) {
                e.stopEvent();
                return false;
            }
        } else {
            if(this.capslock){
                if (this.capsLockIndicatorIconCls || this.capsLockIndicatorText || this.capsLockIndicatorTip) {
	                this.field.clearIndicator();	        
	            }
                
                this.capslock = false;
                this.fireEvent("capslockoff", this);
            }
        }
    }
});
Ext.define('Ext.net.PasswordMask', {
    extend: 'Ext.AbstractPlugin', 
    alias: 'plugin.passwordmask',

    mode : "showlast", // showall, showlast, hideall                        
	duration: 2000,
	replacementChar: '%u25CF',		    
    pattern: "abcdef12",
    allowAnyChars : true,
    strictPassword : false,
    acceptRate : 0.8,

    chars: {        
        digits: "1234567890",
        letters: "abcdefghijklmnopqrstuvwxyz",
        lettersUp: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        symbols: "@#$%^&*()-_=+[]{};:<>/?!"
    },

    messages: {
        pass: "password",
        and: "and",        
        passTooShort: "password is too short (min. length: {0})",
        noCharType: "password must contain {0}",
        digits: "digits",
        letters: "letters",
        lettersUp: "letters in UPPER case",
        symbols: "symbols",
        inBlackList: "password is in list of top used passwords",
        passRequired: "password is required",
        equalTo: "password is equal to login",
        repeat: "password consists of repeating characters",
        badChars: "password contains bad characters: “{0}”"
    },

    blackList: [
        "password", "123456", "12345678", "abc123", "qwerty", "111111", "1234567", "123123", "welcome", "password1", "p@ssw0rd", "root"
    ],
            
    constructor: function(config) {
        if (config && config.chars) {
            this.chars = Ext.apply({}, config.chars, this.chars);
            delete config.chars;
        }

        if (config && config.messages) {
            this.messages = Ext.apply({}, config.messages, this.messages);
            delete config.messages;
        }

        this.callParent(arguments); 
               
        var field = this.getCmp(),
            name = field.getName() || field.id || field.getInputId();

        field.submitValue = false;
        field.passwordMask = this;
        this.fieldGetErrors = field.getErrors;
        field.getErrors = this.getErrors;
        field.getPassword = Ext.Function.bind(this.getPassword, this);

        this.hiddenField = Ext.create('Ext.form.field.Hidden', {
            name : name
        });
               
        if (field.rendered) {
            field.inputEl.dom.removeAttribute('name');
            this.renderHiddenField();
            this.handleValue(field, field.getValue(), "");
        }
        else {
            field.on("beforerender", this.onBeforeRender, this);
            field.on("afterrender", this.renderHiddenField, this);
        }
               
        this.maskAll = Ext.Function.createBuffered(this._maskAll, this.duration, this);

        field.on("change", this.handleValue, this);
    },

    onBeforeRender : function () {
        var field = this.getCmp();
        this.handleValue(field, field.getValue(), "");
    },

    getPassword : function () {
        return this.hiddenField.getValue();
    },

    setMode : function (mode) {
        if (this.mode == mode) {
            return;
        }

        this.mode = mode;

        if (!this.getCmp().rendered) {
            return;
        }
        
        if (this.mode == "hideall" || this.mode == "showlast") {
            this._maskAll();
        }
        else {
            this.getCmp().setValue(this.hiddenField.getValue());
        }        
    },

    destroy : function () {
        this.callParent(arguments);
        this.hiddenField.destroy();
    },

    renderHiddenField : function () {
        var field = this.getCmp();
        if(field.ownerCt){
            field.ownerCt.items.add(this.hiddenField);
        }
        else{
            this.hiddenField.render(field.el.parent());
        }               

        field.inputEl.on("keypress", this.onKeyPress, this);
    },

    onDelete: function(caret, delta){
		var value = this.hiddenField.getValue(),
		    split = caret;

		if (Ext.isNumber(caret) && (this.getCaretPosition() < caret)) {			        
			split = caret - delta;
		}
		else if (!Ext.isObject(caret)) {			        
			caret = caret + delta;
		}

		this.hiddenField.setValue(value.slice(0, caret.start || split) + value.slice(caret.end || caret));
	},

    maskChars: function(str) {		        
		var tmp = '',
            value = this.hiddenField.getValue(),
            replacementChar = unescape(this.replacementChar),
            caretPosition = this.getCmp().hasFocus ? this.getCaretPosition() : str.length,
		    add = 0,
            i;

		for (i=0; i < str.length; i++) {
			if (str.charAt(i) == replacementChar) {
				tmp += value.charAt(i - add);
			} else {
				tmp += str.charAt(i);
				if (caretPosition !== str.length) {
					add++;
				}
			}

		}
		this.hiddenField.setValue(tmp);
	},

    _maskAll: function() {
		if (this.mode == "showall") {
            return;
        }
        
        var field = this.getCmp(),
            value = field.getValue(),
            replacementChar = unescape(this.replacementChar),
            tmp,
            caret,
            i;

        if (value != '') {
			tmp = '';
            
			for (i=0; i < value.length; i++) {
				tmp += replacementChar;
			}
			        
            if (field.hasFocus) {                        
                caret = this.getCaretRange();
            }

            field.setValue(tmp);
			        
            if (field.hasFocus) {                        
                this.restoreCaretPos(caret);
            }
		}
	},

    onKeyPress : function () {
        var me = this,
            oldValue = me.cmp.lastValue;

        if (me.mode != "hideall") {
            return;
        }
        
        setTimeout(function () {
            var newValue = me.cmp.getValue();

            if (newValue.length < oldValue.length) {			        
			    me.onDelete(me.getCaretRange(), oldValue.length - newValue.length);
		    }
            else {
                me.maskChars(newValue);
            }           
            
            me._maskAll();
        }, 0);
    },

    handleValue : function (field, newValue, oldValue) {
        var tmp,
            i,
            lastIndex,
            replacementChar = unescape(this.replacementChar),
            caret;

        if (this.mode == "showall") {
            this.hiddenField.setValue(newValue);
            return;
        }

        if(!this.getCmp().hasFocus)
        {
            this.maskChars(newValue);
            this._maskAll();
            return;
        }
        
        if(this.mode == "hideall")
        {
            return;
        }

        newValue = newValue || "";
        oldValue = oldValue || "";
                
        if (newValue.length < oldValue.length) {			        
			this.onDelete(this.getCaretRange(), oldValue.length - newValue.length);
		}

        if (oldValue != newValue) {
			this.maskChars(newValue);
			if (newValue.length > 1) {
				tmp = '';
                lastIndex = -1;
                
				for (i=0; i < newValue.length; i++) {
					if (newValue.charAt(i) != replacementChar) {
                        lastIndex = i;
                    }

                    tmp += replacementChar;
				}
				
                if (lastIndex >= 0) {            
                    tmp = this.replaceAt(tmp, lastIndex, newValue.charAt(lastIndex));
                }
				caret = this.getCaretRange();
				field.setValue(tmp);
				this.restoreCaretPos(caret);
			}			        

            this.maskAll();
		}
    },

    replaceAt : function(str, index, character) {
      return str.substr(0, index) + character + str.substr(index+character.length);
    },

    selectText : function(start, end){
        var me = this.getCmp(),
            v = me.getRawValue(),
            el = me.inputEl.dom,
            undef,
            range;

        if (v.length > 0) {
            start = start === undef ? 0 : start;
            end = end === undef ? v.length : end;
            if (el.setSelectionRange) {
                el.setSelectionRange(start, end);
            }
            else if(el.createTextRange) {
                range = el.createTextRange();
                range.moveStart('character', start);
                range.moveEnd('character', end - v.length);
                range.select();
            }
        }
    },

    restoreCaretPos: function(caret){
		if (!this.getCmp().hasFocus) {
            return;
        }

        if(Ext.isNumber(caret)) {
            return this.selectText(caret, caret);
        }
        else if(Ext.isObject(caret)) {
            return this.selectText(caret.start, caret.end);
        }
	},            

    getCaretPosition : function () {
        var caretPos = 0,
            field = this.getCmp(),
            dom = field.inputEl.dom,
            sel;
                
        if (document.selection) {
            //field.focus();
            sel = document.selection.createRange();
            sel.moveStart ('character', -field.getValue().length);
            caretPos = sel.text.length;
        }                
        else if (dom.selectionStart || dom.selectionStart == '0') {
            caretPos = dom.selectionStart;
        }

        return caretPos;
    },

    getSelectedRange : function () {
        var caretPos = 0,
            field = this.getCmp(),
            dom = field.inputEl.dom,
            sel;
                
        if (document.selection) {
            var start = 0, 
                end = 0, 
                normalizedValue, 
                textInputRange, 
                len, 
                endRange,
                range = document.selection.createRange();

            if (range && range.parentElement() == dom) {
                len = dom.value.length;

                normalizedValue = dom.value.replace(/\r\n/g, "\n");
                textInputRange = dom.createTextRange();
                textInputRange.moveToBookmark(range.getBookmark());
                endRange = dom.createTextRange();
                endRange.collapse(false);
                if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                    start = end = len;
                } else {
                    start = -textInputRange.moveStart("character", -len);
                    start += normalizedValue.slice(0, start).split("\n").length - 1;
                    if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                        end = len;
                    } else {
                        end = -textInputRange.moveEnd("character", -len);
                        end += normalizedValue.slice(0, end).split("\n").length - 1;
                    }
                }
            }

            caretPos = {                    
                start : start,
                end : end
            };
        }                
        else if (dom.selectionStart || dom.selectionStart == '0') {
            caretPos = {                    
                start : dom.selectionStart,
                end : dom.selectionEnd
            };
        }

        return caretPos;
    },

	getCaretRange: function() {		        
		var range = this.getSelectedRange();
        return (range.start === range.end) ? this.getCaretPosition() : range;
	},

    generatePassword : function (pattern) {
        this.setMode("showall");        
        this.getCmp().setValue(this.createRandomPassword(pattern));        
    },

    createRandomPassword : function (pattern) {
        pattern = pattern || this.pattern;

        var result = "",
            charTypes = this.splitToCharTypes(pattern, "symbols"),
            charTypesSeq = [];

        Ext.iterate(charTypes, function(charType, chars) {
            for (var j = 0; j < chars.length; j++) {
                charTypesSeq.push(charType);
            }
        });

        charTypesSeq = charTypesSeq.sort(function() { 
            return 0.7 - Math.random(); 
        });

        Ext.each(charTypesSeq, function(charType) {
            var sequence = this.chars[charType];
            if (sequence) {
                if (this.chars[charType] && this.chars[charType].indexOf(sequence) < 0) {
                    sequence = this.chars[charType]; 
                }
            } else {
                sequence = this.chars[charType];
            }
            result += this.selectRandom(sequence);
        }, this);

        return result;
    },

    splitToCharTypes : function (str, defaultCharType) {
        var result = {},
            i,
            ch,
            type;

        for (i = 0; i < str.length; i++) {
            ch = str.charAt(i);
            type = defaultCharType;

            Ext.iterate(this.chars, function(charType, seq) {
                if (seq.indexOf(ch) >= 0) {
                    type = charType;
                    return false;
                }
                return true;
            });

            result[type] = (result[type] || "") + ch;
        }
        return result;
    },

    selectRandom : function(arr) {
        var pos = Math.floor(Math.random() * arr.length);
        return Ext.isArray(arr) ? arr[pos] : arr.charAt(pos);
    },

    calculateStrength : function (pass, pattern) {
        pattern = pattern || this.pattern;
        pass = pass || this.hiddenField.getValue();

        var charTypesPattern = this.splitToCharTypes(pattern, "symbols"),
            charTypesPass = this.splitToCharTypes(pass, this.allowAnyChars ? "symbols" : "unknown"),
            messages = [],
            strength,
            charTypesPatternCount = 0;

        Ext.iterate(charTypesPattern, function (charType) {
            charTypesPatternCount++;
            if (!charTypesPass[charType]) {
                var msg = this.messages[charType],
                    symbolsCount = 4,
                    charsExample = this.chars[charType];

                if (charType == "symbols") {                    
                    if (charsExample.length > symbolsCount) {
                        charsExample = charsExample.substring(0, symbolsCount);
                    }
                    msg = msg + " (" + charsExample + ")";
                }
                messages.push(msg);
            }
        }, this);

        strength = 1 - messages.length / charTypesPatternCount;

        if (messages.length) {
            messages = [this.joinMessagesForCharTypes(messages)];
        }

        if (!this.strictPassword) {
            var extraCharTypesCount = 0;
            Ext.iterate(charTypesPass, function(charType) {
                if (!charTypesPattern[charType]) {                    
                    extraCharTypesCount++;
                }
            });
            strength += extraCharTypesCount / charTypesPatternCount;
        }

        var lengthRatio = pass.length / pattern.length - 1;
        if (lengthRatio < 0) {
            strength += lengthRatio;
            messages.push(Ext.String.format(this.messages.passTooShort, pattern.length));
        } else {
            if (!this.strictPassword) {
                strength += lengthRatio / charTypesPatternCount;
            }
        }

        if (pass.length > 2) {
            var firstChar = pass.charAt(0),
                allEqual = true;

            for (var i = 0; i < pass.length; i++) {
                if (pass.charAt(i) != firstChar) {
                    allEqual = false;
                    break;
                }
            }
            if (allEqual) {
                strength = 0;
                messages = [this.messages.repeat];
            }
        }

        if (strength < 0) {
            strength = 0;
        }
        
        if (strength > 1) {
            strength = 1;
        }

        return { strength: strength, messages: messages, charTypes: charTypesPass };
    },

    joinMessagesForCharTypes : function (messages) {
        var replacement = messages[0];
        for (var i = 1; i < messages.length; i++) {
            if (i == messages.length - 1) {
                replacement += " " + this.messages.and + " ";
            } 
            else {
                replacement += ", ";
            }

            replacement += messages[i];
        }

        return Ext.String.format(this.messages.noCharType, replacement);
    },

    validatePassword : function () {
        var pass = this.hiddenField.getValue() || "",
            checkResult,
            isInBlackList = false;

        if (pass.length == 0) {
            checkResult = { strength: 0, messages: [] };
        } else {            
            checkResult = this.calculateStrength(pass);

            if (!this.allowAnyChars && checkResult.charTypes["unknown"]) {
                checkResult = { strength: null, messages: [Ext.String.format(this.messages.badChars, checkResult.charTypes["unknown"])] };
            }
            delete checkResult.charTypes;

            Ext.each(this.blackList, function(el) {
                if (el == pass) {
                    isInBlackList = true;
                    return false;
                }

                return true;
            });

            if (isInBlackList) {
                checkResult = { strength: 0, messages: [this.messages.inBlackList] };
            }
            
            if (pass && pass === this.getLoginFieldValue()) {
                checkResult = { strength: 0, messages: [this.messages.equalTo] };
            }
        }        
        
        if (pass.length == 0 && this.allowBlank) {            
            this.lastValidation = { strength: 0, valid : true };            
        } 
        else if (checkResult.strength === null || checkResult.strength < this.acceptRate) {
            checkResult.valid = false;
            this.lastValidation = checkResult;
        } 
        else {
            this.lastValidation = { strength: checkResult.strength, valid : true };
        }

        return this.lastValidation;
    },

    getLoginFieldValue : function () {
        if (!this.loginField) {
            return null;
        }

        if (Ext.isString(this.loginField)) {
            this.loginField = Ext.net.ResourceMgr.getCmp(this.loginField);
        }

        return this.loginField.getValue();
    },

    getErrors : function (value) {
        var originalErrors = this.passwordMask.fieldGetErrors.call(this, value),
            validation = this.passwordMask.validatePassword();

        return !validation.valid ? originalErrors.concat(validation.messages) : originalErrors;
    }
});
Ext.define('Ext.net.InputMask', {
    extend: 'Ext.AbstractPlugin', 
    alias: 'plugin.inputmask',

    defaultMaskSymbols: {
		"9": "[0-9]",
		"a": "[A-Za-z]",
		"*": "[A-Za-z0-9]"     
	},

    placeholder : "_",
    alwaysShow : false,
    clearWhenInvalid : true,
    allowInvalid : false,
    invalidMaskText : "",
    unmaskOnBlur : false,

    init: function (field) {
        this.callParent(arguments);
        this.ignoreChange = 0;
        this.maskSymbols = Ext.applyIf(this.maskSymbols || {}, this.defaultMaskSymbols);
        this.removeEmptyMaskSymbols();
        this.getCmp().inputMask = this;
        this.notEnabled = true; 

        if (!this.disabled) {
            this.enable();
        }
    },

    enable: function () {
        if (!this.notEnabled && !this.disabled) {
            return;
        }

        this.notEnabled = false;
        this.callParent(arguments);

        var field = this.getCmp();

        field.blur();
        field.enableKeyEvents = true;

        if (field.rendered) {
            field.mon(field.inputEl, {
                scope: field,
                keyup: field.onKeyUp,
                keydown: field.onKeyDown,
                keypress: field.onKeyPress
            });
        }

        this.clearInitError();

        field.on("focus", this.onFocus, this);
        field.on("blur", this.onBlur, this);
        field.on("keydown", this.onKeyDown, this);
        field.on("keypress", this.onKeyPress, this);
        field.on("change", this.checkEmptyField, this);

        if (this.rendered) {
            this.initPasteEvent();
        } else {
            field.on("afterrender", this.initPasteEvent, this, { single: true });
        }

        if (!this.allowInvalid) {
            this.fieldGetErrors = field.getErrors;
            field.getErrors = Ext.Function.bind(this.getErrors, this);
        }

        this.setMask(this.mask);
    },

    checkEmptyField : function (field, newValue, oldValue) {
        if(this.unmasked || this.ignoreChange){
            return;
        }

        if (Ext.isEmpty(newValue)) {
            this.clearBuffer(0, this.maskLength);
			if(field.hasFocus || (!field.hasFocus && this.alwaysShow)){
                this.writeBuffer();
            }
            if (field.hasFocus) {
                this.moveCaret(0);
            }
        }
    },

    disable: function () {
        if (this.disabled) {
            return;
        }

        this.callParent(arguments);

        var field = this.getCmp();

        field.blur();
        this.unmask();

        if (this.originBeginLayout) {
            field.getComponentLayout().beginLayout = this.originBeginLayout;
        }

        if (field.rendered) {
            field.mun(field.inputEl, {
                scope: field,
                keyup: field.onKeyUp,
                keydown: field.onKeyDown,
                keypress: field.onKeyPress
            });
        }

        field.un("focus", this.onFocus, this);
        field.un("blur", this.onBlur, this);
        field.un("keydown", this.onKeyDown, this);
        field.un("keypress", this.onKeyPress, this);

        if (this.rendered) {
            this.getCmp().inputEl.un((Ext.isIE ? "paste" : "input"), this.pasteHandler, this);
        } else {
            field.un("afterrender", this.initPasteEvent, this);
        }

        if (this.fieldGetErrors) {
            field.getErrors = this.fieldGetErrors;
        }
    },

    clearInitError : function () {
        var me = this,
            field = me.getCmp(),
            layout = field.getComponentLayout(),
            originFn = layout.beginLayout;

        this.originBeginLayout = originFn;

        if (!field.preventMark) {
            field.preventMark = true;
            me.clearPreventMark = true;

            layout.beginLayout = function (ownerContext) {
                if(me.clearPreventMark) {
                   field.preventMark = false;    
                   originFn.call(layout, ownerContext);
                   field.preventMark = true;  
                }
                else{
                    originFn.call(layout, ownerContext);
                }
            };
        }
    },

    getErrors : function () {
        var field = this.getCmp(),
            errors = this.fieldGetErrors.call(field, field.processRawValue(field.getRawValue()));

        if(!this.isValueValid()){
            errors.push(this.invalidMaskText || field.invalidText);
        }

        return errors;
    },

    initPasteEvent : function () {
        this.getCmp().inputEl.on((Ext.isIE ? "paste" : "input"), this.pasteHandler, this, {delay:1});
    },

    pasteHandler : function (){
        if(this.unmasked){
            return;
        }
        var pos = this.validateMask(true);
        this.getCmp().selectText(pos, pos);
    },

    onFocus : function (field) {
        if (this.clearPreventMark) {
            Ext.Function.defer(function(){
                this.getCmp().preventMark = false;
                delete this.clearPreventMark;
            }, 1, this);            
        }

        if(this.unmaskOnBlur){
            this.setMask(this.mask);
        }

        if(this.unmasked){
            return;
        }

        if(!this.alwaysShow) {
            this.focusText = field.getValue();
			var pos = this.validateMask();
			this.writeBuffer();
				
            if(Ext.isIE) {
                this.moveCaret(pos);
            }
            else{
                Ext.Function.defer(this.moveCaret, 1, this, [pos]);
            }				
        }        
    },

    onBlur : function () {
        if(this.unmasked){
            return;
        }

        if(!this.alwaysShow) {
            this.validateMask();
        }
        else if(this.clearWhenInvalid && !this.isValueValid()){
            this.ignoreChange++;
            this.getCmp().setValue("");
			this.clearBuffer(0, this.maskLength);
			this.writeBuffer();
            this.ignoreChange--;
        }

        if(this.unmaskOnBlur){
            if(!this.isValueValid()){
                this.unmasked = true;                
                this.ignoreChange++;
                this.getCmp().setValue("");
			    this.clearBuffer(0, this.maskLength);
			    if(this.alwaysShow){
                   this.writeBuffer();
                }
                this.ignoreChange--;
            }
            else{
                this.unmask();
            }
        }
    },

    moveCaret : function (pos) {
        this.getCmp().selectText(pos == this.mask.length ? 0 : pos, pos);
    },

    removeEmptyMaskSymbols : function () {
        Ext.Object.each(this.maskSymbols, function(key, value){
            if(Ext.isEmpty(value)){
                delete this.maskSymbols[key];
            }
        });
    },

    setMask : function (mask) {
        var field = this.getCmp();

        this.unmasked = false;

        if (!Ext.isString(mask)) {
            mask = "";
        }
			    
        this.mask = mask;
        this.regexes = [];
        this.placeholders = [];
		this.requiredPartEnd = mask.length;
		this.maskStart = null;
		this.maskLength = mask.length;
        this.focusText = field.getValue();

		Ext.each(mask.split(""), function(char, index) {
			if (char == '?') {
				this.maskLength--;
				this.requiredPartEnd = index;
			} else if (this.maskSymbols[char]) {
				this.regexes.push(new RegExp(this.maskSymbols[char].regex || this.maskSymbols[char]));
                this.placeholders.push(this.maskSymbols[char].placeholder || this.placeholder);
					    
                if(this.maskStart == null) {
					this.maskStart =  this.regexes.length - 1;
                }
			} else {
				this.regexes.push(null);
                this.placeholders.push(null);
			}
		}, this);     

        this.buffer = [];
                
        var i = 0,
            char,
            array = this.mask.split(""),
            len = array.length;

        for (; i < len; i++) {                    
            char = array[i];
            if (char != "?") {
                this.buffer.push(this.maskSymbols[char] ? (this.maskSymbols[char].placeholder || this.placeholder) : char) 
            }
        }

        this.validateMask();
        if(this.alwaysShow) {
            this.writeBuffer();
        }
    },

    getSelectedRange : function () {
        var caretPos = 0,
            field = this.getCmp(),
            dom = field.inputEl.dom,
            sel;
                
        if (document.selection) {
            var start = 0, 
                end = 0, 
                normalizedValue, 
                textInputRange, 
                len, 
                endRange,
                range = document.selection.createRange();

            if (range && range.parentElement() == dom) {
                len = dom.value.length;

                normalizedValue = dom.value.replace(/\r\n/g, "\n");
                textInputRange = dom.createTextRange();
                textInputRange.moveToBookmark(range.getBookmark());
                endRange = dom.createTextRange();
                endRange.collapse(false);
                if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                    start = end = len;
                } else {
                    start = -textInputRange.moveStart("character", -len);
                    start += normalizedValue.slice(0, start).split("\n").length - 1;
                    if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                        end = len;
                    } else {
                        end = -textInputRange.moveEnd("character", -len);
                        end += normalizedValue.slice(0, end).split("\n").length - 1;
                    }
                }
            }

            caretPos = {                    
                begin : start,
                end : end
            };
        }                
        else if (dom.selectionStart || dom.selectionStart == '0') {
            caretPos = {                    
                begin : dom.selectionStart,
                end : dom.selectionEnd
            };
        }

        return caretPos;
    },


    seekNext : function (pos) {
		while (++pos <= this.maskLength && !this.regexes[pos]);
		return pos;
	},

	seekPrev : function (pos) {
		while (--pos >= 0 && !this.regexes[pos]);
		return pos;
	},

	shiftL : function (begin,end) {
		if(begin<0) {
			return;
        }

		for (var i = begin, j = this.seekNext(end); i < this.maskLength; i++) {
			if (this.regexes[i]) {
				if (j < this.maskLength && this.regexes[i].test(this.buffer[j])) {
					this.buffer[i] = this.buffer[j];
					this.buffer[j] = this.placeholders[j] || this.placeholder;
				} else {
					break;
                }
				j = this.seekNext(j);
			}
		}

		this.writeBuffer();
		this.getCmp().selectText(Math.max(this.maskStart, begin), Math.max(this.maskStart, begin));
	},

	shiftR : function (pos) {
		for (var i = pos, c = this.placeholder; i < this.maskLength; i++) {
			if (this.regexes[i]) {
				var j = this.seekNext(i),
					t = this.buffer[i];

				this.buffer[i] = c;
				if (j < this.maskLength && this.regexes[j].test(t)){
					c = t;
				} else {
					break;
                }
			}
		}
	},

    onKeyDown : function (field, e) {
		if(this.unmasked){
            return;
        }

        var key = e.getKey();
				
		if (key == e.BACKSPACE || key == e.DELETE) {
			var pos = this.getSelectedRange(),
				begin = pos.begin,
				end = pos.end;

			if (end-begin == 0) {
				begin = key != e.DELETE ? this.seekPrev(begin) : (end = this.seekNext(begin-1));
				end = key == e.DELETE ? this.seekNext(end) : end;
			}

			this.clearBuffer(begin, end);
			this.shiftL(begin, end-1);
            e.stopEvent(); 
			return false;
		} else if (key == e.ESC) {
			field.setValue(this.focusText);
			field.selectText(0, this.validateMask());
            e.stopEvent(); 
			return false;
		}
	},

	onKeyPress : function (field, e) {				        
        if (e.ctrlKey && !e.altKey || this.unmasked) {
            return;
        }

        var key = e.getKey(),
            charCode = String.fromCharCode(e.getCharCode()),
            p,
            next,
            pos = this.getSelectedRange();

        if((Ext.isGecko || Ext.isOpera) && (e.isNavKeyPress() || key === e.BACKSPACE || (key === e.DELETE && e.button === -1))){
            return;
        }

        if((!Ext.isGecko && !Ext.isOpera) && e.isSpecialKey() && !charCode){
            return;
        } 

        if (key < 32) {
            return;
        }

		if (key) {
			if(pos.end - pos.begin != 0 ){
				this.clearBuffer(pos.begin, pos.end);
				this.shiftL(pos.begin, pos.end - 1);
			}

			p = this.seekNext(pos.begin - 1);
			if (p < this.maskLength) {						
				if (this.regexes[p].test(charCode)) {
					this.shiftR(p);
					this.buffer[p] = charCode;
					this.writeBuffer();
					next = this.seekNext(p);
                    field.selectText(next, next);
					//if (next >= this.maskLength) {								                                
                    //}
				}
			}
            e.stopEvent();
			return false;
		}
	},

    clearBuffer : function (start, end) {
		for (var i = start; i < end && i < this.maskLength; i++) {
			if (this.regexes[i]) {
				this.buffer[i] = this.placeholders[i];
            }
		}
	},

	writeBuffer : function () { 
        this.getCmp().setValue(this.buffer.join('')); 
        return this.getCmp().getValue();
    },

    isValueValid : function () {                
        var value = this.getCmp().getValue(),
			valid = true,
            lastMatch = -1,
            i,
            c,
            pos;

		for (i = 0, pos = 0; i < this.maskLength; i++) {
			if (this.regexes[i]) {
						
                while (pos++ < this.regexes.length) {
					c = value.charAt(pos - 1);
					if (this.regexes[i].test(c)) {
						lastMatch = i;
						break;
					}
				}

				if (pos > value.length) {
					break;
                }
			} else if (this.buffer[i] == value.charAt(pos) && i != this.requiredPartEnd) {
				pos++;
				lastMatch = i;
			}
		}

        if ((lastMatch + 1) < this.requiredPartEnd) {
			valid = false;                    
		}

		return valid;
    },

    validateMask : function (allow) {				
		var value = this.getCmp().getValue(),
			lastMatch = -1,
            i,
            c,
            pos;

		for (i = 0, pos = 0; i < this.maskLength; i++) {
			if (this.regexes[i]) {
				this.buffer[i] = this.placeholders[i];
						
                while (pos++ < this.regexes.length) {
					c = value.charAt(pos - 1);
					if (this.regexes[i].test(c)) {
						this.buffer[i] = c;
						lastMatch = i;
						break;
					}
				}

				if (pos > value.length) {
					break;
                }
			} else if (this.buffer[i] == value.charAt(pos) && i != this.requiredPartEnd) {
				pos++;
				lastMatch = i;
			}
		}

		if (!allow && (lastMatch + 1) < this.requiredPartEnd) {
			if(!this.alwaysShow) {
                this.ignoreChange++;
                this.getCmp().setValue("");
				this.clearBuffer(0, this.maskLength);
                this.ignoreChange--;
            }                    
		} else if (allow || lastMatch + 1 >= this.requiredPartEnd) {
			this.writeBuffer();
			if (!allow) {
                this.getCmp().setValue(this.getCmp().getValue().substring(0, lastMatch + 1));                        
            }
		}
		return (this.requiredPartEnd ? i : this.maskStart);
	},

    getUnmaskedValue : function () {        
        var i,
            c,
            placeholder,
            value = this.getCmp().getValue(),
            uValue = [];

        for (i = 0; i < this.maskLength; i++) {
			if (this.regexes[i]) {
                c = value.charAt(i);
                placeholder = this.placeholders[i];
                if(c && c != placeholder){
                    uValue.push(c);
                }
            }
        }

        return uValue.join("");
    },

    unmask : function () {
        this.unmasked = true;        
        this.getCmp().setValue(this.getUnmaskedValue());
    }
});
Ext.define('Ext.ux.CellDragDrop', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.celldragdrop',

    uses: ['Ext.view.DragZone'],

    // *************************************************

    // Will only allow drops of the same type.
    enforceType: false,

    // If applyEmptyText is `true`, then use the value of emptyText to replace the drag record's value after a node drop.
    // Note that if dropped on a cell of a differnt type it will convert the default text according to its own conversion rules.
    applyEmptyText: false,
    emptyText: '',

    // The default background colors of the targeted node when entering node.
    dropBackgroundColor: 'green',
    noDropBackgroundColor: 'red',

    // **************************************************

    dragText: '{0} selected row{1}',
    ddGroup: "GridDD",

    enableDrop: true,

    enableDrag: true,

    containerScroll: false,

    init: function (view) {
        var me = this;

        view.on('render', me.onViewRender, me, {
            single: true
        });
    },

    destroy: function () {
        var me = this;

        Ext.destroy(me.dragZone, me.dropZone);
    },

    enable: function () {
        var me = this;

        if (me.dragZone) {
            me.dragZone.unlock();
        }
        if (me.dropZone) {
            me.dropZone.unlock();
        }
        me.callParent();
    },

    disable: function () {
        var me = this;

        if (me.dragZone) {
            me.dragZone.lock();
        }
        if (me.dropZone) {
            me.dropZone.lock();
        }
        me.callParent();
    },

    onViewRender: function (view) {
        var me = this,
            scrollEl;

        if (me.enableDrag) {
            if (me.containerScroll) {
                scrollEl = view.getEl();
            }

            me.dragZone = new Ext.view.DragZone({
                view: view,
                ddGroup: me.dragGroup || me.ddGroup,
                dragText: me.dragText,
                containerScroll: me.containerScroll,
                scrollEl: scrollEl,
                getDragData: function (e) {
                    var view = this.view,
                        item = e.getTarget(view.getItemSelector()),
                        record = view.getRecord(item),
                        clickedEl = e.getTarget(view.getCellSelector()),
                        dragEl;

                    if (item) {
                        dragEl = document.createElement('div');
                        dragEl.className = 'x-form-text';
                        dragEl.appendChild(document.createTextNode(clickedEl.textContent || clickedEl.innerText));

                        return {
                            event: new Ext.EventObjectImpl(e),
                            ddel: dragEl,
                            item: e.target,
                            columnName: view.getGridColumns()[clickedEl.cellIndex].dataIndex,
                            record: record
                        };
                    }
                },

                onInitDrag: function (x, y) {
                    var self = this,
                        data = self.dragData,
                        view = self.view,
                        selectionModel = view.getSelectionModel(),
                        record = data.record,
                        el = data.ddel;

                    // Update the selection to match what would have been selected if the user had
                    // done a full click on the target node rather than starting a drag from it.
                    if (!selectionModel.isSelected(record)) {
                        selectionModel.select(record, true);
                    }

                    self.ddel.update(el.textContent || el.innerText);
                    self.proxy.update(self.ddel.dom);
                    self.onStartDrag(x, y);
                    return true;
                }
            });
        }

        if (me.enableDrop) {
            me.dropZone = new Ext.dd.DropZone(view.el, {
                view: view,
                ddGroup: me.dropGroup || me.ddGroup,
                containerScroll: true,

                getTargetFromEvent: function (e) {
                    var self = this,
                        v = self.view,
                        cell = e.getTarget(v.cellSelector),
                        row, columnIndex;

                    // Ascertain whether the mousemove is within a grid cell.
                    if (cell) {
                        row = v.findItemByChild(cell);
                        columnIndex = cell.cellIndex;

                        if (row && Ext.isDefined(columnIndex)) {
                            return {
                                node: cell,
                                record: v.getRecord(row),
                                columnName: self.view.up('grid').columns[columnIndex].dataIndex
                            };
                        }
                    }
                },

                // On Node enter, see if it is valid for us to drop the field on that type of column.
                onNodeEnter: function (target, dd, e, dragData) {
                    var self = this,
                        destType = target.record.fields.get(target.columnName).type.type.toUpperCase(),
                        sourceType = dragData.record.fields.get(dragData.columnName).type.type.toUpperCase();

                    delete self.dropOK;

                    // Return if no target node or if over the same cell as the source of the drag.
                    if (!target || target.node === dragData.item.parentNode) {
                        return;
                    }

                    // Check whether the data type of the column being dropped on accepts the
                    // dragged field type. If so, set dropOK flag, and highlight the target node.
                    if (me.enforceType && destType !== sourceType) {

                        self.dropOK = false;

                        if (me.noDropCls) {
                            Ext.fly(target.node).addCls(me.noDropCls);
                        } else {
                            Ext.fly(target.node).applyStyles({
                                backgroundColor: me.noDropBackgroundColor
                            });
                        }

                        return;
                    }

                    self.dropOK = true;

                    if (me.dropCls) {
                        Ext.fly(target.node).addCls(me.dropCls);
                    } else {
                        Ext.fly(target.node).applyStyles({
                            backgroundColor: me.dropBackgroundColor
                        });
                    }
                },

                // Return the class name to add to the drag proxy. This provides a visual indication
                // of drop allowed or not allowed.
                onNodeOver: function (target, dd, e, dragData) {
                    return this.dropOK ? this.dropAllowed : this.dropNotAllowed;
                },

                // Highlight the target node.
                onNodeOut: function (target, dd, e, dragData) {
                    var cls = this.dropOK ? me.dropCls : me.noDropCls;

                    if (cls) {
                        Ext.fly(target.node).removeCls(cls);
                    } else {
                        Ext.fly(target.node).applyStyles({
                            backgroundColor: ''
                        });
                    }
                },

                // Process the drop event if we have previously ascertained that a drop is OK.
                onNodeDrop: function (target, dd, e, dragData) {
                    if (this.dropOK) {
                        target.record.set(target.columnName, dragData.record.get(dragData.columnName));
                        if (me.applyEmptyText) {
                            dragData.record.set(dragData.columnName, me.emptyText);
                        }
                        return true;
                    }
                },

                onCellDrop: Ext.emptyFn
            });
        }
    }
});

Ext.define("Ext.net.ClearButton", { 
    extend: "Ext.util.Observable",
    alias: "plugin.clearbutton", 
            
    hideIfEmpty: true, 
    hideOnMouseOut: true,             
    clearOnEsc: true,             
    cls: "x-clear-button",

    constructor: function(cfg) { 
        Ext.apply(this, cfg);
        this.addEvents("beforeclear", "clear");
        this.callParent(arguments); 
    }, 

    init: function(field) {                 
        this.field = field; 

        if (field.rendered) { 
            this.initPlugin();                     
        } 
        else { 
            field.on("afterrender", this.initPlugin, this, {single:true}); 
        } 
    }, 

    initPlugin: function() {
        this.el = this.field.bodyEl.createChild({ 
            tag: "div", 
            cls: this.cls 
        }); 
        this.el.hide();

        this.initEvents();

        if (this.clearOnEsc) {
            this.field.inputEl.on("keydown", this.onEsc, this);
        }

        this.field.inputEl.addCls("x-clear-field");

        this.updatePosition(); 
        this.updateVisibility();                
    }, 

    clear : function (focus) {
        if(this.fireEvent("beforeclear", this) !== false) {        
            var value = this.field.getValue();
            this.field.setValue(''); 

            if(focus !== false) {                    
                this.field.focus(); 
            }
            this.fireEvent("clear", this, value);
        }
    },

    onEsc : function(e) { 
        if (e.getKey() == Ext.EventObject.ESC) { 
            if (this.field.isExpanded) {
                return; 
            } 
                    
            this.clear();
            e.stopEvent(); 
        } 
    },

    initEvents: function() { 

        this.field.on({
            resize : this.updatePosition,
            change : this.updateButton,
            scope : this
        });
                
        this.field.bodyEl.on({
            mouseover : this.onMouseOver,
            mouseout : this.onMouseOut,
            scope : this
        });

        this.el.on("click", this.clear, this); 
    }, 

    destroy: function() { 
        this.el.destroy(); 
        this.callParent(arguments);                
    }, 

    onMouseOver: function() {                  
        this.mouseOver = true;
        this.updateVisibility(true); 
    }, 

    onMouseOut: function() {                  
        this.mouseOver = false;
        this.updateVisibility(false); 
    }, 

    fieldHasScrollBar: function() { 
        var inputEl = this.field.inputEl,
            overflowY; 

        if (inputEl.dom.type.toLowerCase() !== "textarea") { 
            return false; 
        } 

        overflowY = inputEl.getStyle("overflow-y"); 

        if (overflowY == "hidden" || overflowY == "visible") { 
            return false; 
        } 

        if (overflowY == "scroll") { 
            return true; 
        } 
                
        if (inputEl.dom.scrollHeight <= inputEl.dom.clientHeight) { 
            return false; 
        } 

        return true; 
    }, 

    getPosition: function() { 
        var pos = this.field.inputEl.getBox(false, true),
            top = pos.y,
            right = pos.x; 

        if (this.fieldHasScrollBar()) { 
            right += Ext.getScrollBarWidth(); 
        } 
        
        return { 
            right: right, 
            top: top 
        }; 
    }, 

    updatePosition: function() { 
        if (this.el) { 
            var pos = this.getPosition();                    
            
            if (this.field.getHierarchyState().rtl) {
                this.el.alignTo(this.field.inputEl, "l-l?", [pos.right + 2, 0], false);
            } 
            else {
                this.el.alignTo(this.field.inputEl, "r-r?", [-pos.right - 2, 0], false);
            }
        }                 
    },

    updateButton : function() { 
        this.updatePosition(); 
        this.updateVisibility(); 
    },

    updateVisibility: function() {                 
        var el = this.el; 

        if (el) {
            if (this.field.readOnly
                || (this.hideIfEmpty && Ext.isEmpty(this.field.getValue()))
                || (this.hideOnMouseOut && !this.mouseOver)
                ) { 
                this.el.hide(); 
            }
            else {
                this.el.show();
            }

            this.updatePosition(); 
        }                
    }
}); 

Ext.define('Ext.ux.DataTip', function(DataTip) {

//  Target the body (if the host is a Panel), or, if there is no body, the main Element.
    function onHostRender() {
        var e = this.isXType('panel') ? this.body : this.el;
        if (this.dataTip.renderToTarget) {
            this.dataTip.render(e);
        }
        this.dataTip.setTarget(e);
    }

    function updateTip(tip, data) {
        if(tip.beforeShowTip(tip.eventHost, tip, data) === false) {
            return false;
        }

        if (tip.rendered) {
            tip.update(data);
        } else {
            if (Ext.isString(data)) {
                tip.html = data;
            } else {
                tip.data = data;
            }
        }
    }

    function beforeViewTipShow(tip) {
        var rec = this.view.getRecord(tip.triggerElement),
            data;

        if (rec) {
            data = tip.initialConfig.data ? Ext.apply(tip.initialConfig.data, rec.data) : rec.data;
            return updateTip(tip, data);
        } else {
            return false;
        }
    }

    function beforeFormTipShow(tip) {
        var field = Ext.getCmp(tip.triggerElement.id);
        if (field && (field.tooltip || tip.tpl)) {
            return updateTip(tip, field.tooltip || field);
        } else {
            return false;
        }
    }

    return {
        extend: 'Ext.tip.ToolTip',

        mixins: {
            plugin: 'Ext.AbstractPlugin'
        },

        alias: 'plugin.datatip',

        lockableScope: 'both',

        beforeShowTip : Ext.emptyFn,

        constructor: function(config) {
            var me = this;
            me.callParent([config]);
            me.mixins.plugin.constructor.call(me, config);
        },

        init: function(host) {
            var me = this;

            me.mixins.plugin.init.call(me, host);
            host.dataTip = me;
            me.host = host;

            if (host.isXType('tablepanel')) {
                me.view = host.getView();
                if (host.ownerLockable) {
                    me.host = host.ownerLockable;
                }
                me.delegate = me.delegate || me.view.getDataRowSelector();
                me.on('beforeshow', beforeViewTipShow);
            } else if (host.isXType('dataview')) {
                me.view = me.host;
                me.delegate = me.delegate || host.itemSelector;
                me.on('beforeshow', beforeViewTipShow);
            } else if (host.isXType('form')) {
                me.delegate = '.' + Ext.form.Labelable.prototype.formItemCls;
                me.on('beforeshow', beforeFormTipShow);
            } else if (host.isXType('combobox')) {
                me.view = host.getPicker();
                me.delegate = me.delegate || me.view.getItemSelector();
                me.on('beforeshow', beforeViewTipShow);
            }
            if (host.rendered) {
                onHostRender.call(host);
            } else {
                host.onRender = Ext.Function.createSequence(host.onRender, onHostRender);
            }
        }
    };
});
Ext.define("Ext.net.FilterHeader", {
    extend : "Ext.util.Observable",
    alias : "plugin.filterheader",

    autoReload : true,
    updateBuffer : 500,
    filterParam : "filterheader",
    remote: false,
    //ignoreHiddenColumn : false,
    //caseSensitive : false,
    //decimalSeparator : ".",
    //clearTime : true,
    //dateFormat 
    //submitDateFormat 
    //value

    statics: { 
        behaviour : {
            caseSensitive : false,
            decimalSeparator : ".",
            clearTime : true,
            //dateFormat 
            //submitDateFormat                    

            isRemote : function () {
                var plugin = Ext.net.FilterHeader.behaviour.plugin;
                        
                return plugin && plugin.remote;
            },
                    
            getOption : function  (name) {
                var plugin = Ext.net.FilterHeader.behaviour.plugin;
                        
                if (plugin && Ext.isDefined(plugin[name])) {
                    return plugin[name];
                }

                return Ext.net.FilterHeader.behaviour[name];
            },
                    
            getStrValue : function (value) {
                return Ext.net.FilterHeader.behaviour.getOption("caseSensitive") || !value || Ext.net.FilterHeader.behaviour.isRemote() ? value : value.toLowerCase();
            },

            getNumericValue : function (value) {
                value = parseFloat(String(value).replace(Ext.net.FilterHeader.behaviour.getOption("decimalSeparator"), '.'));
                return isNaN(value) ? null : value;
            },

            getDateValue : function (value, format) {
                var date = Ext.Date.parse(value, Ext.net.FilterHeader.behaviour.getOption("dateFormat") || format || "c");                        
                return Ext.isDate(date) ? (Ext.net.FilterHeader.behaviour.getOption("clearTime") ? Ext.Date.clearTime(date, true) : date) : null;
            },

            getBehaviourByName : function (groupName, behaviourName) {
                var group = Ext.net.FilterHeader.behaviour[groupName];

                if (group) {
                    var i, len;
                    for (i = 0, len = group.length; i < len; i++ ) {
                        if (group[i].name == behaviourName) {
                            return group[i];
                        }
                    }
                }

                return null;
            },

            getBehaviour : function (groupName, value) {
                var group = Ext.net.FilterHeader.behaviour[groupName];

                if (group) {
                    var i, len;
                    for (i = 0, len = group.length; i < len; i++ ) {
                        if (group[i].is(value)) {
                            return group[i];
                        }
                    }
                }

                return null;
            },

            addBehaviour : function (groupName, behaviour, replace) {
                if (!behaviour.name) {
                    throw "Please define a name for behaviour";
                }

                var oldBhv = Ext.net.FilterHeader.behaviour.getBehaviourByName(groupName, behaviour.name);

                if(oldBhv && replace !== true) {
                    throw "Behaviour with name '" + behaviour.name + "' already exists";
                }

                var group = Ext.net.FilterHeader.behaviour[groupName];

                if (oldBhv) {
                    Ext.Array.replace(group, Ext.Array.indexOf(group, oldBhv), 1, [behaviour]);
                }
                else if(Ext.isNumber(replace)){
                    Ext.Array.insert(group, replace, [behaviour]);
                }
                else {
                    group.push(behaviour);
                }
            },

            removeBehaviour : function (groupName, behaviourName) {
                var oldBhv = Ext.net.FilterHeader.behaviour.getBehaviourByName(groupName, behaviourName);

                if(!oldBhv) {
                    throw "Behaviour with name '" + behaviourName + "' is not found";
                }

                Ext.Array.remove(Ext.net.FilterHeader.behaviour[groupName], oldBhv);

                return oldBhv;
            },

            string : [
                {
                    is : function (value) {
                        return false;
                    },

                    getValue : function (value) {
                        return {value: Ext.net.FilterHeader.behaviour.getStrValue(value), valid: true};
                    },

                    match : function (recordValue, matchValue) {
                        return Ext.net.StringUtils.startsWith(Ext.net.FilterHeader.behaviour.getStrValue(recordValue) || "", matchValue);
                    },

                    isValid : function (value) {
                        return true;
                    },

                    serialize : function (value) {
                        return {
                            type : "string",
                            op: "+",
                            value : value
                        };
                    }
                },
                {
                    name : "+",

                    is : function (value) {
                        return value[0] === "+";
                    },

                    getValue : function (value) {
                        return {value: Ext.net.FilterHeader.behaviour.getStrValue(value).substring(1), valid: this.isValid(value)};
                    },

                    match : function (recordValue, matchValue) {
                        return Ext.net.StringUtils.startsWith(Ext.net.FilterHeader.behaviour.getStrValue(recordValue) || "", matchValue);
                    },

                    isValid : function (value) {
                        return value.length > 1;
                    },

                    serialize : function (value) {
                        return {
                            type : "string",
                            op: "+",
                            value : value
                        };
                    }
                },

                {
                    name : "-",

                    is : function (value) {
                        return value[0] === "-";
                    },

                    getValue : function (value) {
                        return {value: Ext.net.FilterHeader.behaviour.getStrValue(value).substring(1), valid: this.isValid(value)};
                    },

                    match : function (recordValue, matchValue) {
                        return Ext.net.StringUtils.endsWith(Ext.net.FilterHeader.behaviour.getStrValue(recordValue) || "", matchValue);
                    },

                    isValid : function (value) {
                        return value.length > 1;
                    },

                    serialize : function (value) {
                        return {
                            type : "string",
                            op: "-",
                            value : value
                        };
                    }
                },

                {
                    name : "=",

                    is : function (value) {
                        return value[0] === "=";
                    },

                    getValue : function (value) {
                        return {value: Ext.net.FilterHeader.behaviour.getStrValue(value).substring(1), valid: this.isValid(value)};
                    },

                    match : function (recordValue, matchValue) {
                        return Ext.net.FilterHeader.behaviour.getStrValue(recordValue) == matchValue;
                    },

                    isValid : function (value) {
                        return value.length > 1;
                    },

                    serialize : function (value) {
                        return {
                            type : "string",
                            op: "=",
                            value : value
                        };
                    }
                },

                {
                    name : "*",

                    is : function (value) {
                        return value[0] === "*";
                    },

                    getValue : function (value) {
                        return {value: Ext.net.FilterHeader.behaviour.getStrValue(value).substring(1), valid: this.isValid(value)};
                    },

                    match : function (recordValue, matchValue) {
                        return recordValue && (Ext.net.FilterHeader.behaviour.getStrValue(recordValue).indexOf(matchValue) > -1); 
                    },

                    isValid : function (value) {
                        return value.length > 1;
                    },

                    serialize : function (value) {
                        return {
                            type : "string",
                            op: "*",
                            value : value
                        };
                    }
                },

                {
                    name : "!",

                    is : function (value) {
                        return value[0] === "!";
                    },

                    getValue : function (value) {
                        return {value: Ext.net.FilterHeader.behaviour.getStrValue(value).substring(1), valid: this.isValid(value)};
                    },

                    match : function (recordValue, matchValue) {
                        return recordValue && (Ext.net.FilterHeader.behaviour.getStrValue(recordValue).indexOf(matchValue) < 0); 
                    },

                    isValid : function (value) {
                        return value.length > 1;
                    },

                    serialize : function (value) {
                        return {
                            type : "string",
                            op: "!",
                            value : value
                        };
                    }
                }
            ],

            numeric : [
                {
                    is : function (value) {
                        return false;
                    },

                    getValue : function (value) {
                        var bhv_value = Ext.net.FilterHeader.behaviour.getNumericValue(value);
                        return {value: bhv_value, valid: bhv_value !== null || Ext.isEmpty(value)};
                    },

                    match : function (recordValue, matchValue) {
                        return recordValue === matchValue;
                    },

                    isValid : function (value) {
                        return Ext.net.FilterHeader.behaviour.getNumericValue(value) !== null || Ext.isEmpty(value);
                    },

                    serialize : function (value) {
                        return {
                            type : "numeric",
                            op: "=",
                            value : value
                        };
                    }
                },

                {
                    name : "compare",

                    map : {
                        ">"  : "gt",
                        "<"  : "lt",
                        ">=" : "gte",
                        "<=" : "lte"
                    },

                    is : function (value) {                                
                        var parts = value.split(/(>=|<=|>|<)/i);
                        return parts.length > 1;
                    },

                    getValue : function (value) {
                        var nums = value.split(/(>=|<=|>|<)/i),                            
                            num,
                            valid = Ext.isEmpty(value),
                            tmp = [];
                
                        Ext.each(nums, function(num){
                            num = num.trim();
                            if(!Ext.isEmpty(num, false)){
                                tmp.push(num);
                            }
                        });
            
                        nums = tmp;
                        v = {};
            
                        if (nums.length == 1) {
                            if (!(nums[0][0] == ">" || nums[0][0] == "<")) {
                                num = Ext.net.FilterHeader.behaviour.getNumericValue(nums[0]);
                
                                if (Ext.isNumber(num)) {
                                    v.eq = num;
                                    valid = true;
                                }                        
                            }                                
                        }
                        else {
                            if (nums[0] == ">" || nums[0] == "<" || nums[0] == "<=" || nums[0] == ">=") {
                                num = Ext.net.FilterHeader.behaviour.getNumericValue(nums[1]);
                
                                if (Ext.isNumber(num)) {
                                    v[this.map[nums[0]]] = num;
                                    valid = true;
                                }    
                            }
                
                            if (nums[2] == ">" || nums[2] == "<" || nums[2] == "<=" || nums[2] == ">=") {
                                num = Ext.net.FilterHeader.behaviour.getNumericValue(nums[3]);
                
                                if(Ext.isNumber(num)){                    
                                    v[this.map[nums[2]]] = num;
                                    valid = true;
                                }
                                else {
                                    valid = false;
                                }
                            }
                        }

                        return {value: v, valid: valid};
                    },

                    match : function (recordValue, matchValue) {
                        if (matchValue.lt !== undefined  && recordValue >= matchValue.lt) {
                            return false;
                        }
                        if (matchValue.gt !== undefined  && recordValue <= matchValue.gt) {
                            return false;
                        }
                        if (matchValue.lte !== undefined  && recordValue > matchValue.lte) {
                            return false;
                        }
                        if (matchValue.gte !== undefined  && recordValue < matchValue.gte) {
                            return false;
                        }
                        if (matchValue.eq !== undefined  && recordValue !== matchValue.eq) {
                            return false;
                        }        
        
                        return true; 
                    },

                    isValid : function (value) {
                        return this.getValue(value, field).valid;
                    },

                    serialize : function (value) {
                        return {
                            type : "numeric",
                            op: "compare",
                            value : value
                        };
                    }
                }
            ],

            date : [
                {
                    is : function (value) {
                        return false;
                    },

                    getValue : function (value, field) {
                        var date = Ext.net.FilterHeader.behaviour.getDateValue(value, field.column.format);

                        return {value: date, valid: date !== null || Ext.isEmpty(value)};
                    },

                    match : function (recordValue, matchValue) {
                        var recordDate = recordValue && (Ext.net.FilterHeader.behaviour.getOption("clearTime") ? Ext.Date.clearTime(recordValue, true).getTime() : recordValue.getTime());
                        return recordDate === (matchValue && matchValue.getTime());
                    },

                    isValid : function (value, field) {
                        return Ext.net.FilterHeader.behaviour.getDateValue(value, field.column.format) !== null || Ext.isEmpty(value);
                    },

                    serialize : function (value) {
                        return {
                            type : "date",
                            op: "=",
                            value : Ext.Date.format(value, Ext.net.FilterHeader.behaviour.getOption("submitDateFormat") || "Y-m-d")
                        };
                    }
                },

                {
                    name : "compare",

                    map : {
                        ">"  : "gt",
                        "<"  : "lt",
                        ">=" : "gte",
                        "<=" : "lte"
                    },

                    is : function (value) {                                
                        var parts = value.split(/(>=|<=|>|<)/i);
                        return parts.length > 1;
                    },

                    getValue : function (value, field) {
                        var dates = value.split(/(>=|<=|>|<)/i),                            
                            date,
                            valid = Ext.isEmpty(value),
                            tmp = [];
                
                        Ext.each(dates, function(dt){
                            dt = dt.trim();
                            if (!Ext.isEmpty(dt, false)) {
                                tmp.push(dt);
                            }
                        });
            
                        dates = tmp;
                        v = {};
            
                        if (dates.length == 1) {
                            if (!(dates[0][0] == ">" || dates[0][0] == "<")) {
                                date = Ext.net.FilterHeader.behaviour.getDateValue(dates[0], field.column.format);
                
                                if (Ext.isDate(num)) {
                                    v.eq = num;
                                    valid = true;
                                }                        
                            }                                
                        }
                        else {
                            if (dates[0] == ">" || dates[0] == "<" || dates[0] == "<=" || dates[0] == ">=") {
                                date = Ext.net.FilterHeader.behaviour.getDateValue(dates[1], field.column.format);
                
                                if (Ext.isDate(date)) {
                                    v[this.map[dates[0]]] = date;
                                    valid = true;
                                }    
                            }
                
                            if (dates[2] == ">" || dates[2] == "<" || dates[2] == "<=" || dates[2] == ">=") {
                                date = Ext.net.FilterHeader.behaviour.getDateValue(dates[3], field.column.format);
                
                                if(Ext.isDate(date)){                    
                                    v[this.map[dates[2]]] = date;
                                    valid = true;
                                }
                                else {
                                    valid = false;
                                }
                            }
                        }

                        return {value: v, valid: valid};
                    },

                    match : function (recordValue, matchValue) {
                        var recordDate = recordValue && (Ext.net.FilterHeader.behaviour.getOption("clearTime") ? Ext.Date.clearTime(recordValue, true).getTime() : recordValue.getTime());

                        if (matchValue.lt !== undefined  && recordDate >= matchValue.lt.getTime()) {
                            return false;
                        }
                        if (matchValue.gt !== undefined  && recordDate <= matchValue.gt.getTime()) {
                            return false;
                        }
                        if (matchValue.lte !== undefined  && recordDate > matchValue.lte.getTime()) {
                            return false;
                        }
                        if (matchValue.gte !== undefined  && recordDate < matchValue.gte.getTime()) {
                            return false;
                        }
                        if (matchValue.eq !== undefined  && recordDate !== matchValue.eq.getTime()) {
                            return false;
                        }        
        
                        return true; 
                    },

                    isValid : function (value) {
                        return this.getValue(value, field).valid;
                    },

                    serialize : function (value) {
                        var serValue = {},
                            format = Ext.net.FilterHeader.behaviour.getOption("submitDateFormat") || "Y-m-d";

                        if (value.lt !== undefined) {
                            serValue.lt = Ext.Date.format(value.lt, format);
                        }
                        if (value.gt !== undefined) {
                            serValue.gt = Ext.Date.format(value.gt, format);
                        }
                        if (value.lte !== undefined) {
                            serValue.lte = Ext.Date.format(value.lte, format);
                        }
                        if (value.gte !== undefined) {
                            serValue.gte = Ext.Date.format(value.gte, format);
                        }
                        if (value.eq !== undefined) {
                            serValue.eq = Ext.Date.format(value.eq, format);
                        }
                                
                        return {
                            type : "date",
                            op: "compare",
                            value : serValue
                        };
                    }
                }
            ],

            boolean : [
                {
                    is : function (value) {
                        return false;
                    },

                    getValue : function (value, field) {                                
                        var bool = null;
                        if (value === 1 || value === "1" || value === "true" || value === "True") {
                            bool = true;
                        }
                        else if (value === 0 || value === "0" || value === "false" || value === "False") {
                            bool = false;
                        }
                        return {value: bool, valid: bool !== null || Ext.isEmpty(value)};
                    },

                    match : function (recordValue, matchValue) {
                        return recordValue === matchValue;
                    },

                    isValid : function (value, field) {
                        return this.getValue(value, field).valid;
                    },

                    serialize : function (value) {
                        return {
                            type : "boolean",
                            op: "=",
                            value : value
                        };
                    }
                }
            ]
        }
    },

    constructor : function () {
        this.initEvents();
        this.callParent(arguments);
    },

    init : function (grid) {
        this.grid = grid;
        grid.filterHeader = this;
        this.view = grid.getView();
        this.store = grid.store;
        this.fields = [];
        this.prevFilters = {};
        this.onFieldChange = Ext.Function.createBuffered(this.onFieldChange, this.updateBuffer, this);

        if (this.remote) {
            this.store.on("before" + (this.store.buffered ? "prefetch" : "load"), this.onBeforeLoad, this);
        }

        (this.view.normalView || this.view).on("viewready", this.initColumns, this);
    },            

    initEvents : function () {
        this.addEvents("beforefilter", "filter");
    },

    initColumns : function () {
        var columns = this.grid.headerCt.getGridColumns();
        Ext.each(columns, function (column) {
            this.addColumnField(column);
        }, this);

        this.grid.headerCt.on("add", this.onColumnAdd, this);
        this.grid.headerCt.on("remove", this.onColumnRemove, this);

        if (this.value) {
            this.setValue(this.value);
            delete this.value;
        }
    },            

    addColumnField : function (column) {
        this.initField(this.extractField(column), column);
    },

    removeColumnField : function (column) {
        var field = this.extractField(column);
        if (field && (!field.isXType("displayfield") || field.filterFn)) {
            Ext.Array.remove(this.fields, field);
            delete field.column;
            field.un("change", this.onFieldChange, this);
            delete this.filterFn;
        }
    },

    initField : function (field, column) {
        if (field && (!field.isXType("displayfield") || field.filterFn)) {
            this.fields.push(field);
            field.column = column;
            field.filterRow = this;
            field.on("change", this.onFieldChange, this);

            if (!field.filterFn) {
                field.filterFn = Ext.Function.bind(this.smartFilterValue, this);
                field.isSmart = true;
            }

            delete this.filterFn;   
        }                
    },

    getValue : function (includeEmpty) {
        var value = {};

        Ext.each(this.fields, function(field) {     
            var filterValue = field.getFilterValue ? field.getFilterValue() : field.getValue();
            if(!Ext.isEmpty(filterValue) || includeEmpty === true) {
                value[field.column.dataIndex] = filterValue;
            }
        });

        return value;
    },

    setValue : function (value) {
        var _old = this.autoReload,
            valid = true;
        this.autoReload = false;

        Ext.each(this.fields, function(field) {     
            field.setValue(value[field.column.dataIndex]);

            if (!this.isSmartFilterValid(field)) {
                valid = false;
            }
        }, this);

        this.autoReload = _old;
        if (valid) {
            this.runFiltering();
        }
    },

    onColumnAdd : function (headerCt, column) {
        this.addColumnField(column);
    },

    onColumnRemove : function (headerCt, column) {
        this.removeColumnField(column);
    },

    extractField : function (column) {
        var ctr = column.items.get(0);
        return ctr && ctr.items.get(0);
    },

    onFieldChange : function (field, value) {
        if (this.isSmartFilterValid(field)) {
            this.runFiltering();
        }
    },

    runFiltering : function () {
        if (!this.autoReload) {
            return;
        }
                
        var changed = false;
        Ext.each(this.fields, function(field) {            
            var value = field.getFilterValue ? field.getFilterValue() : field.getValue(),
                eq = false,
                dataIndex = field.column.dataIndex,
                prevValue = this.prevFilters[dataIndex];

            if (Ext.isEmpty(value, false) && !Ext.isDefined(prevValue)) {
                return;
            }
            
            if (Ext.isDate(value) && Ext.isDate(prevValue)) {
                eq = value.getTime() !== prevValue.getTime();
            }
            else {
                eq = value !== prevValue;
            }
            
            if (eq) {
                changed = true;
                this.prevFilters[dataIndex] = value;
            }
        }, this);
        
        if(changed){
            this.applyFilter();
        }
    },

    applyFilter : function () {
        if (this.fireEvent("beforefilter", this) !== false) {
            if (this.remote) {
                this.applyRemoteFilter();            
            } else {
                var store = this.grid.getStore();
                store.clearFilter(true);
                store.filterBy(this.getRecordFilter());            
            }
            this.fireEvent("filter", this);
        }
    },

    applyRemoteFilter : function () {
        var store = this.store;
        if (store.buffered) {
            store.data.clear();
        }

        store.loadPage(1);
    },

    onBeforeLoad : function (store, options) {
        options.params = options.params || {};
        delete options.params[this.filterParam];
        
        var values = this.getFilterValues();               
        
        if(values == null){
            return false;
        }        
                
        options.params[this.filterParam] = Ext.encode(values);
    },

    getFilterValues : function () {
        var values = {};
            
        Ext.each(this.fields, function(field){
            var val = field.getFilterValue ? field.getFilterValue() : field.getValue(), 
                type,
                dataIndex = field.column.dataIndex,
                bhv;

            if (!Ext.isEmpty(val, false)) {
                if (field.isSmart && Ext.isString(val) && field.lastFilterValue) {
                    if (!this.isSmartFilterValid(field)) {
                        return;
                    }
                    bhv = field.lastFilterValue.behaviour;
                            
                    type = this.getFieldType(field);
                    val = bhv.serialize(field.lastFilterValue.convertedValue.value, dataIndex);
                    
                    values[dataIndex] = val;
                }
                else {
                    if (!Ext.isEmpty(val, false)) {
                        values[dataIndex] = {
                            type : this.getFieldType(field),
                            op: "=",
                            dataIndex : dataIndex,
                            value : val
                        };    
                    }
                }            
            }            
        }, this);
        
        return values;
    },

    getRecordFilter : function () {
        if(this.filterFn){
            return this.filterFn;
        }
        
        var f = [],        
            len;
            
        Ext.each(this.fields, function(field){
            var me = this;            
            
            f.push(function (record) {
                var fn = me.filterAuto,
                    value = field.getFilterValue ? field.getFilterValue() : field.getValue(),
                    dataIndex = field.column.dataIndex;                   
                
                if (field.filterFn) {
                    fn = field.filterFn;
                }
                else if (Ext.isDate(value)) {
                    fn = me.filterDate;
                }
                else if (Ext.isNumber(value)) {
                    fn = me.filterNumber;
                }
                else if (Ext.isString(value)) {
                    fn = me.filterString;
                }
                                       
                return fn(value, dataIndex, record, null, field);
            });
        }, this);
        
        len = f.length;
                 
        this.filterFn = function (record) {
            for (var i = 0; i < len; i++) {
                if (!f[i](record)) {
                    return false;
                }
            }
            return true;
        };
        
        return this.filterFn;
    },
    
    clearFilter : function () {
        var _oldautoReload = this.autoReload;

        this.prevFilters = {};
        this.autoReload = false;

        Ext.each(this.fields, function(field){
            if (Ext.isFunction(field.reset)) {                
                field.reset();
            }
        }, this);

        this.autoReload = _oldautoReload;    
                
        if (this.remote) {
            this.applyRemoteFilter();            
        } else {
            this.grid.store.clearFilter();
        }                
    },

    filterString : function (value, dataIndex, record) {
        var val = record.get(dataIndex);
        
        if(Ext.isNumber(val)){
            if (!Ext.isEmpty(value, false) && val != value) {
                return false;
            }
            
            return true;
        }
        
        if (typeof val != "string") {
            return value.length == 0;
        }
        
        return this.stringFilterBehaviour(val, value);
    },

    stringFilterBehaviour : function (value, matchValue) {
        return Ext.net.StringUtils.startsWith(value.toLowerCase(), matchValue.toLowerCase());
    },

    filterDate : function (value, dataIndex, record) {
        var val = Ext.Date.clearTime(record.get(dataIndex), true).getTime();

        if (!Ext.isEmpty(value, false) && val != Ext.Date.clearTime(value, true).getTime()) {
            return false;
        }
        return true;
    },

    filterNumber : function (value, dataIndex, record) {
        var val = record.get(dataIndex);                

        if (!Ext.isEmpty(value, false) && val != value) {
            return false;
        }
        
        return true;
    },
    
    filterAuto : function (value, dataIndex, record) {
        var val = record.get(dataIndex);                

        if (!Ext.isEmpty(value, false) && val != value) {
            return false;
        }
        
        return true;
    },

    getFieldType : function (field) {
        var modelField = this.grid.store.getFieldByName(field.column.dataIndex),
            type = modelField && modelField.type ? modelField.type.type : null;

        return type;
    },

    isSmartFilterValid : function (field) {
        var value = field.getFilterValue ? field.getFilterValue() : field.getValue();
        if (field.isSmart && Ext.isString(value)) {
            this.selectSmartFilter(this.getFieldType(field), null, value, field);
            return field.lastFilterValue.valid;
        }

        return Ext.isFunction(field.isValid) ? field.isValid() : true;
    },

    smartFilterValue : function (value, dataIndex, record, type, field) {
        var recordValue = record && record.get(dataIndex),
            isEmpty = Ext.isEmpty(value, false);
            
        if(isEmpty){
            return true;
        }
        
        if(!type && (recordValue == null || !Ext.isDefined(recordValue))){
            return false;
        }
        
        return this.selectSmartFilter(type, recordValue, value, field);
    },

    selectSmartFilter : function (type, recordValue, value, field) {
        Ext.net.FilterHeader.behaviour.plugin = this;
                
        if (type == "boolean" || type == "bool" || Ext.isBoolean(recordValue)) {
            return this.smartFilterBoolean(recordValue, value, field);
        }
        else if (type == "date" || Ext.isDate(recordValue)) {
            return this.smartFilterDate(recordValue, value, field);
        }
        else if (type == "int" || type == "float" || Ext.isNumber(recordValue)) {
            return this.smartFilterNumber(recordValue, value, field);
        }
        else  {
            return this.smartFilterString(recordValue, value, field);
        }

        delete Ext.net.FilterHeader.behaviour.plugin;
        
        return false;
    },
    
    smartFilterBoolean : function (recordValue, value, field) {
        var v,
            bhv_value,
            bhv;                
        
        if (field.lastFilterValue && field.lastFilterValue.value == value) {
            v = field.lastFilterValue.convertedValue;
            bhv = field.lastFilterValue.behaviour;
        }
        else {                    
            bhv = Ext.net.FilterHeader.behaviour.getBehaviour("boolean", value);

            if (!bhv) {
                bhv = Ext.net.FilterHeader.behaviour.defaultBooleanBehaviour;
            }

            bhv_value = bhv.getValue(value, field);
            v = {value : bhv_value.value};
            field.lastFilterValue = {value:value, behaviour: bhv, convertedValue: v, valid : bhv_value.valid };                    
        }
        
        return field.lastFilterValue.valid ? bhv.match(recordValue, v.value) : true;
    },
    
    smartFilterDate : function (recordValue, value, field) {
        var v,
            bhv_value,
            bhv;                
        
        if (field.lastFilterValue && field.lastFilterValue.value == value) {
            v = field.lastFilterValue.convertedValue;
            bhv = field.lastFilterValue.behaviour;
        }
        else {                    
            bhv = Ext.net.FilterHeader.behaviour.getBehaviour("date", value);

            if (!bhv) {
                bhv = Ext.net.FilterHeader.behaviour.defaultDateBehaviour;
            }

            bhv_value = bhv.getValue(value, field);
            v = {value : bhv_value.value};
            field.lastFilterValue = {value:value, behaviour: bhv, convertedValue: v, valid : bhv_value.valid };                    
        }
        
        return field.lastFilterValue.valid ? bhv.match(recordValue, v.value) : true;
    },
    
    smartFilterNumber : function (recordValue, value, field) {
        var v,
            bhv_value,
            bhv;                
        
        if (field.lastFilterValue && field.lastFilterValue.value == value) {
            v = field.lastFilterValue.convertedValue;
            bhv = field.lastFilterValue.behaviour;
        }
        else {                    
            bhv = Ext.net.FilterHeader.behaviour.getBehaviour("numeric", value);

            if (!bhv) {
                bhv = Ext.net.FilterHeader.behaviour.defaultNumericBehaviour;
            }

            bhv_value = bhv.getValue(value, field);
            v = {value : bhv_value.value};
            field.lastFilterValue = {value:value, behaviour: bhv, convertedValue: v, valid : bhv_value.valid };                    
        }
        
        return field.lastFilterValue.valid ? bhv.match(recordValue, v.value) : true;
    },
    
    smartFilterString : function (recordValue, value, field) {
        var v,
            bhv_value,
            bhv;                
        
        if (field.lastFilterValue && field.lastFilterValue.value == value) {
            v = field.lastFilterValue.convertedValue;
            bhv = field.lastFilterValue.behaviour;
        }
        else {                    
            bhv = Ext.net.FilterHeader.behaviour.getBehaviour("string", value);

            if (!bhv) {
                bhv = Ext.net.FilterHeader.behaviour.defaultStringBehaviour;
            }

            bhv_value = bhv.getValue(value, field);
            v = {value : bhv_value.value};
            field.lastFilterValue = {value:value, behaviour: bhv, convertedValue: v, valid : bhv_value.valid };                    
        }
        
        if (Ext.isEmpty(v.value, false)) {
            return true;
        }

        recordValue = recordValue && Ext.net.FilterHeader.behaviour.getStrValue(recordValue);        
        return field.lastFilterValue.valid ? bhv.match(recordValue, v.value) : true;
    }    
}, function () {
    this.behaviour.defaultStringBehaviour = this.behaviour.string[0];
    this.behaviour.defaultNumericBehaviour = this.behaviour.numeric[0];
    this.behaviour.defaultDateBehaviour = this.behaviour.date[0];
    this.behaviour.defaultBooleanBehaviour = this.behaviour.boolean[0];
});

Ext.define('Ext.ux.GroupTabPanel', {
    extend: 'Ext.Container',

    alias: 'widget.grouptabpanel',

    requires:[
        'Ext.data.*',
        'Ext.tree.*',
        'Ext.layout.*'
    ],

    baseCls : Ext.baseCSSPrefix + 'grouptabpanel',
    activeGroup : 0,
    activeTab : 0,

    initComponent: function(config) {
        var me = this;

        Ext.apply(me, config);

        // Processes items to create the TreeStore and also set up
        // "this.cards" containing the actual card items.
        me.store = me.createTreeStore();

        me.layout = {
            type: 'hbox',
            align: 'stretch'
        };
        me.defaults = {
            border: false
        };

        me.items = [{
            xtype: 'treepanel',
            cls: 'x-tree-panel x-grouptabbar',
            width: me.tabWidth || 150,
            rootVisible: false,
            store: me.store,
            hideHeaders: true,
            animate: false,
            processEvent: Ext.emptyFn,
            border: false,
            plugins: [{
                ptype: 'grouptabrenderer'
            }],
            viewConfig: {
                overItemCls: '',
                getRowClass: me.getRowClass
            },
            columns: [{
                xtype: 'treecolumn',
                sortable: false,
                dataIndex: 'text',
                flex: 1,
                renderer: function (value, cell, node, idx1, idx2, store, tree) {
                    var cls = '';

                    if (node.parentNode && node.parentNode.parentNode === null) {
                        cls += ' x-grouptab-first';
                        if (node.previousSibling) {
                            cls += ' x-grouptab-prev';
                        }
                        if (!node.get('expanded') || node.firstChild == null) {
                            cls += ' x-grouptab-last';
                        }
                    } else if (node.nextSibling === null) {
                        cls += ' x-grouptab-last';
                    } else {
                        cls += ' x-grouptab-center';
                    }
                    if (node.data.activeTab) {
                        cls += ' x-active-tab';
                    }
                    cell.tdCls= 'x-grouptab'+ cls;

                    return value;
                }
             }]
        },{
            xtype: 'container',
            flex: 1,
            layout: 'card',
            deferredRender : me.deferredRender,            
            baseCls: Ext.baseCSSPrefix + 'grouptabcontainer',
            items: me.cards
        }];

        if(me.tabPosition == "right"){
            var tmp = me.items[0];
            me.items[0] = me.items[1];
            me.items[1] = tmp;
        }

        me.addEvents(
            
            'beforetabchange',

            
            'tabchange',

            
            'beforegroupchange',

            
            'groupchange'
        );

        me.callParent(arguments); 
        me.setActiveGroup(me.activeGroup);
        me.setActiveTab(me.activeTab);               
        me.mon(me.down('treepanel').getSelectionModel(), 'select', me.onNodeSelect, me);

        if (this.hasId()) {
            this.on("render", function () {
                this.getActiveTabField().render(this.el.parent() || this.el);
                this.getActiveGroupField().render(this.el.parent() || this.el);
            }, this);
        }
    },

    getRowClass: function(node, rowIndex, rowParams, store) {
        var cls = '';
        if (node.data.activeGroup) {
           cls += ' x-active-group';
        }
        return cls;
    },

    
    onNodeSelect: function (selModel, node) {
        var me = this,
            parent;

        if (node.parentNode && node.parentNode.parentNode === null) {
            parent = node;
        } else {
            parent = node.parentNode;
        }

        if (me.setActiveGroup(parent.get('groupId')) === false || me.setActiveTab(node.get('id')) === false) {
            return false;
        }
        
        this.refreshView();        
    },

    refreshView : function () {
        var me = this,
            currentNode = me.store.getRootNode(),
            parent;

        if (!me.rendered) {
            return false;
        }

        if (!me.activeGroup) {
            return;
        }

        Ext.each(currentNode.childNodes, function(node){
            if(node.get("groupId") == me.activeGroup.id){
                parent = node;
                return false;
            }
        });
        
        while (currentNode) {
            currentNode.set('activeTab', false);
            currentNode.set('activeGroup', false);
            currentNode = currentNode.firstChild || currentNode.nextSibling || currentNode.parentNode.nextSibling;
        }

        parent.set('activeGroup', true);
        parent.eachChild(function(child) {
            child.set('activeGroup', true);
        });
        
        if(me.activeTab){
            Ext.each(parent.childNodes, function(node){
                if(node.get("id") == me.activeTab.id){
                    node.set('activeTab', true);
                    return false;
                }
            });
        }
        me.down('treepanel').getView().refresh();
    },

    
    setActiveTab: function(cmp) {
        var me = this,
            newTab = cmp,
            index,
            oldTab;

        if(Ext.isNumber(cmp) && me.activeGroup) {            
            Ext.each(me.groups, function(group){
                if(group.id == me.activeGroup.id){
                    cmp = group.tabs[cmp];
                    return false;
                }
            });
        }

        if(Ext.isString(cmp)) {
            newTab = Ext.getCmp(cmp);
        }        

        if (newTab === me.activeTab) {
            return false;
        }

        oldTab = me.activeTab;
        if (me.fireEvent('beforetabchange', me, newTab, oldTab) !== false) {
             me.activeTab = newTab;
             if (me.rendered) {                 
                 me.down('container[baseCls=' + Ext.baseCSSPrefix + 'grouptabcontainer' + ']').getLayout().setActiveItem(newTab);                 
             }
             else{
                this.items.get(1).activeItem = newTab;
             }

             index = 0;

             Ext.each(me.groups, function(group){
                if(group.id == me.activeGroup.id){
                    Ext.each(group.tabs, function(tab, idx){
                        if(newTab.id == tab){
                            index = idx;
                        }
                    });
                    return false;
                }
             });

             this.getActiveTabField().setValue(newTab.id + ':' + index);

             me.fireEvent('tabchange', me, newTab, oldTab);
         }         

         this.refreshView();

         return true;
    },

    
    setActiveGroup: function(cmp, refresh) {
        var me = this,
            newGroup = cmp,
            index,
            oldGroup;

        if(Ext.isNumber(cmp)) {
            cmp = me.groups[cmp].id;
        }
        
        if(Ext.isString(cmp)) {
            newGroup = Ext.getCmp(cmp);
        }
        
        if (newGroup === me.activeGroup) {
            return true;
        }

        oldGroup = me.activeGroup;
        if (me.fireEvent('beforegroupchange', me, newGroup, oldGroup) !== false) {
             me.activeGroup = newGroup;
             index = 0;

             Ext.each(me.groups, function(group, idx){
                if(group.id == me.activeGroup.id){
                    index = idx;
                    return false;
                }
             });

             this.getActiveGroupField().setValue(newGroup.id + ':' + index);
             me.fireEvent('groupchange', me, newGroup, oldGroup);
         } else {
             return false;
         }

         if(refresh) {
            me.refreshView();
         }

         return true;
    },

    
    createTreeStore: function() {
        var me = this,
            groups = me.prepareItems(me.items),
            data = {
                text: '.',
                children: []
            },
            cards = me.cards = [];
        me.activeGroup = me.activeGroup || 0;
        me.groups = [];
        
        Ext.each(groups, function(groupItem, idx) {
            me.groups[idx] = {id:groupItem.id, tabs:[]};

            var leafItems = groupItem.items.items,
                rootItem = (leafItems[groupItem.mainItem] || leafItems[0]),
                groupRoot = {
                    children: []
                };

            // Create the root node of the group
            groupRoot.id = rootItem.id;
            groupRoot.groupId = groupItem.id;
            groupRoot.text = rootItem.title;
            groupRoot.iconCls = rootItem.iconCls;

            groupRoot.expanded = !groupItem.collapsed;
            groupRoot.activeGroup = (me.activeGroup === idx);
            groupRoot.activeTab = groupRoot.activeGroup ? true : false;
            

            Ext.each(leafItems, function(leafItem) {
                // First node has been done
                me.groups[idx].tabs.push(leafItem.id);
                if (leafItem.id !== groupRoot.id) {
                    var child = {
                        id: leafItem.id,
                        groupId : groupItem.id,
                        leaf: true,
                        text: leafItem.title,
                        iconCls: leafItem.iconCls,
                        activeGroup: groupRoot.activeGroup,
                        activeTab: false
                    };
                    groupRoot.children.push(child);
                }

                // Ensure the items do not get headers
                delete leafItem.title;
                delete leafItem.iconCls;
                cards.push(leafItem);
            });

            data.children.push(groupRoot);
      });

       return Ext.create('Ext.data.TreeStore', {
            fields: ['id', 'text', 'activeGroup', 'activeTab', 'groupId'],
            root: {
                expanded: true
            },
            proxy: {
                type: 'memory',
                data: data
            }
        });
    },

    
    getActiveTab: function() {
        return this.activeTab;
    },

    
    getActiveGroup: function() {
        return this.activeGroup;
    },

    getActiveTabField : function () {
        if (!this.activeTabField) {
            this.activeTabField = new Ext.form.field.Hidden({ 
                name  : this.id + "_ActiveTab"
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.activeTabField);
        }

        return this.activeTabField;
    },

    getActiveGroupField : function () {
        if (!this.activeGroupField) {
            this.activeGroupField = new Ext.form.field.Hidden({ 
                name  : this.id + "_ActiveGroup"
            });

			this.on("beforedestroy", function () { 
                if (this.rendered) {
                    this.destroy();
                }
            }, this.activeGroupField);
        }

        return this.activeGroupField;
    }
});

Ext.define('Ext.ux.GroupTabRenderer', {
    alias: 'plugin.grouptabrenderer',
    extend: 'Ext.AbstractPlugin',

    tableTpl: new Ext.XTemplate(
        '<div id="{view.id}-body" class="' + Ext.baseCSSPrefix + '{view.id}-table ' + Ext.baseCSSPrefix + 'grid-table-resizer" style="{tableStyle}">',
            '{%',
                'values.view.renderRows(values.rows, values.viewStartIndex, out);',
            '%}',
        '</div>',
        {
            priority: 5
        }
    ),

    rowTpl: new Ext.XTemplate(
        '{%',
            'Ext.Array.remove(values.itemClasses, "', Ext.baseCSSPrefix + 'grid-row");',
            'var dataRowCls = values.recordIndex === -1 ? "" : " ' + Ext.baseCSSPrefix + 'grid-data-row";',
        '%}',
        '<div {[values.rowId ? ("id=\\"" + values.rowId + "\\"") : ""]} ',
            'data-boundView="{view.id}" ',
            'data-recordId="{record.internalId}" ',
            'data-recordIndex="{recordIndex}" ',
            'class="' + Ext.baseCSSPrefix + 'grouptab-row {[values.itemClasses.join(" ")]} {[values.rowClasses.join(" ")]}{[dataRowCls]}" ',
            '{rowAttr:attributes}>',
            '<tpl for="columns">' +
                '{%',
                    'parent.view.renderCell(values, parent.record, parent.recordIndex, xindex - 1, out, parent)',
                 '%}',
            '</tpl>',
        '</div>',
        {
            priority: 5
        }
    ),

    cellTpl: new Ext.XTemplate(
        '{%values.tdCls = values.tdCls.replace(" ' + Ext.baseCSSPrefix + 'grid-cell "," ");%}',
        '<div class="' + Ext.baseCSSPrefix + 'grouptab-cell {tdCls}" {tdAttr}>',
            '<div {unselectableAttr} class="' + Ext.baseCSSPrefix + 'grid-cell-inner" style="text-align: {align}; {style};">{value}</div>',
            '<div class="x-grouptabs-corner x-grouptabs-corner-top-left"></div>',
            '<div class="x-grouptabs-corner x-grouptabs-corner-bottom-left"></div>',
        '</div>',
        {
            priority: 5
        }
    ),

    selectors: {
        // Outer table
        bodySelector: 'div.' + Ext.baseCSSPrefix + 'grid-table-resizer',

        // Element which contains rows
        nodeContainerSelector: 'div.' + Ext.baseCSSPrefix + 'grid-table-resizer',

        // row
        itemSelector: 'div.' + Ext.baseCSSPrefix + 'grouptab-row',

        // row which contains cells as opposed to wrapping rows
        dataRowSelector: 'div.' + Ext.baseCSSPrefix + 'grouptab-row',

        // cell
        cellSelector: 'div.' + Ext.baseCSSPrefix + 'grouptab-cell', 

        getCellSelector: function(header) {
            var result = 'div.' + Ext.baseCSSPrefix + 'grid-cell';
            if (header) {
                result += '-' + header.getItemId();
            }
            return result;
        }

    },

    init: function(grid) {
        var view = grid.getView(), 
            me = this;
        view.addTableTpl(me.tableTpl);
        view.addRowTpl(me.rowTpl);
        view.addCellTpl(me.cellTpl);
        Ext.apply(view, me.selectors);
    }
});

Ext.define('Ext.ux.LiveSearchGridPanel', {
    extend: 'Ext.util.Observable',
    alias: 'plugin.livesearch',
    
    
    searchValue: null,
    
    
    indexes: [],
    
    
    currentIndex: null,
    
    
    searchRegExp: null,
    
    
    caseSensitive: false,
    
    
    regExpMode: false,

    hightlightOnRefresh : false,
    
    
    matchCls: 'x-livesearch-match',

    constructor : function (config) {
        Ext.apply(this, config);   
        this.initEvents();
        this.callParent(arguments);
    },
    
    init : function (grid) {
        this.grid = grid;        
        this.grid.liveSearchPlugin = this;

        if (this.hightlightOnRefresh) {
            this.hightlightOnRefresh = false;
            this.toggleHightlightOnRefresh(true);
        }

        if (this.value) {
            if(this.grid.view.viewReady) {
                this.initValue();
            }
            else {
                this.grid.view.on("viewready", this.initValue, this, {single:true});
            }
        }
    },
    
    initEvents : function () {
        this.addEvents("beforesearch", "search", "regexperror", "regexpmodechange", "casesensitivechange");
    },

    // detects html tag
    tagsRe: /<[^>]*>/gm,
    
    // DEL ASCII code
    tagsProtect: '\x0f',

    ampsRe: /&\w+;/gm,    
    ampsProtect: '\x10',
    
    // detects regexp reserved word
    regExpProtect: /\\|\/|\+|\\|\.|\[|\]|\{|\}|\?|\$|\*|\^|\|/gm,

    initValue : function () {
        if (this.grid.store.getCount() > 0) {
            this.search(this.value);
        }
        else {
            this.grid.store.on("load", this.initValue, this, {single:true, delay:100});
        }
    },
    
    
    getSearchValue: function() {
        var me = this,
            value = me.value;
            
        if (value === '') {
            return null;
        }
        if (!me.regExpMode) {
            value = value.replace(me.regExpProtect, function(m) {
                return '\\' + m;
            });
        } else {
            try {
                new RegExp(value);
            } catch (error) {
                me.errorMessage = error.message;
                me.fireEvent("regexperror", me, error.message);
                return null;
            }
            // this is stupid
            if (value === '^' || value === '$') {
                return null;
            }
        }

        return value;
    },
    
    
     search: function(value) {
         var me = this,
             count = 0;

         me.value = value;

         if (me.fireEvent("beforesearch", me, me.value) === false) {
             return;
         }

         me.grid.view.refresh();                  

         me.searchValue = me.getSearchValue();
         me.indexes = [];
         me.currentIndex = null;

         if (me.searchValue !== null) {
             me.searchRegExp = new RegExp(me.searchValue, 'g' + (me.caseSensitive ? '' : 'i'));             
             
             me.grid.store.each(function(record, idx) {
                 var td = Ext.fly(me.grid.view.getNode(idx)).down('td.x-grid-cell'),
                     cell, matches, ampsMatches, cellHTML;
                 while(td) {
                     cell = td.down('.x-grid-cell-inner');
                     matches = cell.dom.innerHTML.match(me.tagsRe);
                     ampsMatches = cell.dom.innerHTML.match(me.ampsRe);
                     cellHTML = cell.dom.innerHTML.replace(me.tagsRe, me.tagsProtect);                     
                     cellHTML = cellHTML.replace(me.ampsRe, me.ampsProtect);                     
                     
                     // populate indexes array, set currentIndex, and replace wrap matched string in a span
                     cellHTML = cellHTML.replace(me.searchRegExp, function(m) {
                         count += 1;
                         if (Ext.Array.indexOf(me.indexes, idx) === -1) {
                             me.indexes.push(idx);
                         }
                         if (me.currentIndex === null) {
                            me.currentIndex = idx;
                         }
                         return '<span class="' + me.matchCls + '">' + m + '</span>';
                     });
                     
                     // restore protected tags
                     Ext.each(matches, function(match) {
                        cellHTML = cellHTML.replace(me.tagsProtect, match); 
                     });

                     // restore protected tags
                     Ext.each(ampsMatches, function(match) {
                        cellHTML = cellHTML.replace(me.ampsProtect, match); 
                     });

                     // update cell html
                     cell.dom.innerHTML = cellHTML;
                     td = td.next();
                 }
             }, me);

             // results found
             if (me.currentIndex !== null) {
                 me.grid.getSelectionModel().select(me.currentIndex);
                 me.fireEvent("search", me, me.value, count);                
             }
         }

         // no results found
         if (me.currentIndex === null) {
             me.grid.getSelectionModel().deselectAll();
             me.fireEvent("search", me, me.value, 0);
         }
     },

    clearHightlight : function () {
        var me = this;

        me.value = null;
        me.grid.view.refresh();
    },
    
       
    prev: function() {
        var me = this,
            idx;
            
        if ((idx = Ext.Array.indexOf(me.indexes, me.currentIndex)) !== -1) {
            me.currentIndex = me.indexes[idx - 1] || me.indexes[me.indexes.length - 1];
            me.grid.getSelectionModel().select(me.currentIndex);
         }
    },
    
        
    next: function() {
         var me = this,
             idx;
             
         if ((idx = Ext.Array.indexOf(me.indexes, me.currentIndex)) !== -1) {
            me.currentIndex = me.indexes[idx + 1] || me.indexes[0];
            me.grid.getSelectionModel().select(me.currentIndex);
         }
    },
    
        
    toggleCaseSensitive: function(value) {
        var oldCaseSensitive = this.caseSensitive;
        this.caseSensitive = Ext.isDefined(value) ? value : !this.caseSensitive;

        if (oldCaseSensitive != this.caseSensitive) {
            this.fireEvent("casesensitivechange", this, this.caseSensitive);
        }

        if (this.value) {
            this.search(this.value);
        }
    },
    
    
    toggleRegExpMode: function(value) {
        var oldRegExpMode = this.regExpMode;
        this.regExpMode = Ext.isDefined(value) ? value : !this.regExpMode;
        
        if (oldRegExpMode != this.regExpMode) {
            this.fireEvent("regexpmodechange", this, this.regExpMode);
        }

        if (this.value) {
            this.search(this.value);
        }
    },

    onViewRefresh : function () {
        if (this.value) {
            this.search(this.value);
        }
    },

    toggleHightlightOnRefresh : function (value) {
        if(this.hightlightOnRefresh){
            this.grid.getView().un("refresh", this.onViewRefresh, this);
        }
        
        this.hightlightOnRefresh = Ext.isDefined(value) ? value : !this.hightlightOnRefresh;

        if(this.hightlightOnRefresh){
            this.grid.getView().on("refresh", this.onViewRefresh, this);
        }
    }
});

Ext.define('Ext.ux.LiveSearchToolbar', {
    extend: 'Ext.toolbar.Toolbar',
    alias: 'widget.livesearchtoolbar',

    searchText : "Search",
    prevText : "&lt;",
    prevTooltipText : "Find Previous Row",
    nextText : "&gt;",
    nextTooltipText : "Find Next Row",
    regExpText : "Regular expression",
    caseSensitiveText : "Case sensitive",

    hideRegExp : false,
    hideCaseSensitive : false,
    searchBuffer : 100,
    searchFieldWidth : 200,

    initComponent : function() {
        var me = this,
            searchItems = me.getSearchItems(),
            userItems   = me.items || [];

        if (me.prependButtons) {
            me.items = userItems.concat(searchItems);
        } else {
            me.items = searchItems.concat(userItems);
        }

        me.callParent();
    },

    getGrid : function () {
        if (!this.grid){
            this.grid = this.up("gridpanel");
        }

        if (Ext.isString(this.grid)) {
            var grid = Ext.getCmp(this.grid);
            if (grid) {
                this.grid = grid;
            }
        }

        return this.grid;
    },    

    afterRender: function() {
        var me = this,
            grid = this.getGrid();
        me.callParent(arguments);
        me.searchField = me.down('#searchField');
        me.regExpField = me.down('#regExpField');
        me.caseSensitiveField = me.down('#caseSensitiveField');

        if (grid) {
            if (grid.liveSearchPlugin.value) {
                me.searchField.suspendEvents();
                me.searchField.setValue(grid.liveSearchPlugin.value);
                me.searchField.resumeEvents();
            }

            grid.liveSearchPlugin.on("search", function (p, value) {
                this.searchField.suspendEvents();
                this.searchField.setValue(grid.liveSearchPlugin.value);
                this.searchField.resumeEvents();
            }, me);

            me.regExpField.suspendEvents();
            me.regExpField.setValue(grid.liveSearchPlugin.regExpMode);
            me.regExpField.resumeEvents();

            grid.liveSearchPlugin.on("regexpmodechange", function (p, value) {
                this.regExpField.suspendEvents();
                this.regExpField.setValue(grid.liveSearchPlugin.regExpMode);
                this.regExpField.resumeEvents();
            }, me);

            me.caseSensitiveField.suspendEvents();
            me.caseSensitiveField.setValue(grid.liveSearchPlugin.caseSensitive);
            me.caseSensitiveField.resumeEvents();

            grid.liveSearchPlugin.on("casesensitivechange", function (p, value) {
                this.caseSensitiveField.suspendEvents();
                this.caseSensitiveField.setValue(grid.liveSearchPlugin.caseSensitive);
                this.caseSensitiveField.resumeEvents();
            }, me);
        }
    },

    getSearchItems: function() {
        var me = this;
        return [me.searchText,
            {
                 xtype: 'textfield',
                 itemId : "searchField",
                 submitValue: false,
                 hideLabel: true,
                 width: this.searchFieldWidth,
                 listeners: {
                     change: {
                         fn: me.onTextFieldChange,
                         scope: this,
                         buffer: this.searchBuffer
                     }
                 }
            }, {
                xtype: 'button',
                text: me.prevText,
                tooltip: me.prevTooltipText,
                handler: me.onPreviousClick,
                scope: me
            },{
                xtype: 'button',
                text: me.nextText,
                tooltip: me.nextTooltipText,
                handler: me.onNextClick,
                scope: me
            }, '-', {
                xtype: 'checkbox',
                itemId : "regExpField",
                hideLabel: true,
                margin: '0 0 0 4px',
                handler: me.regExpToggle,
                hidden : me.hideRegExp,
                submitValue: false,
                scope: me                
            }, {
                xtype : 'tbtext',
                text : me.regExpText, 
                hidden : me.hideRegExp
            }, {
                xtype: 'checkbox',
                hideLabel: true,
                margin: '0 0 0 4px',
                itemId : "caseSensitiveField",
                handler: me.caseSensitiveToggle,
                hidden: me.hideCaseSensitive,
                submitValue: false,               
                scope: me
            }, {
                xtype : 'tbtext',
                text: me.caseSensitiveText,
                hidden : me.hideCaseSensitive
            }];
    },

    onTextFieldChange: function(field) {
        var grid = this.getGrid();
        if (grid) {
            grid.liveSearchPlugin.search(field.getValue());
            field.focus();
        }
    },

    onPreviousClick: function() {
        var grid = this.getGrid();
        if (grid) {
            grid.liveSearchPlugin.prev();
        }
    },
   
    onNextClick: function() {
        var grid = this.getGrid();
        if (grid) {
            grid.liveSearchPlugin.next();
        }
    },    
    
    caseSensitiveToggle: function(checkbox, checked) {
        var grid = this.getGrid();
        if (grid) {
            grid.liveSearchPlugin.toggleCaseSensitive(checked);
        }
    },
   
    regExpToggle: function(checkbox, checked) {
        var grid = this.getGrid();
        if (grid) {
            grid.liveSearchPlugin.toggleRegExpMode(checked);
        }
    }
});


Ext.define('Ext.ux.MouseDistanceSensor', {
    extend: 'Ext.util.Observable', 
    opacity    : true,
    minOpacity : 0,
    maxOpacity : 1,
    threshold  : 100,
    
    constructor : function (config) {
        Ext.apply(this, config);   
        this.initEvents();
        this.callParent(arguments);
    },
    
    init : function (component) {
        this.component = component;                
        
        if (component.rendered) {
            this.onAfterRender();
        } else {
            component.on("afterrender", this.onAfterRender, this, {single : true, delay : 1});                    
        }        
        
        this.component.on("show", this.startMonitoring, this);
        this.component.on("hide", this.stopMonitoring, this);
        this.onMouseMove = Ext.Function.createBuffered(this.onMouseMove, 50, this);
    },
    
    initEvents : function () {
        this.addEvents("near", "far", "distance");
    },
    
    getSensorEls : function () {
        return this.component.el;
    },
    
    getConstrainEls : Ext.emptyFn,
    
    onAfterRender : function () {        
        this.el = this.component.el;
        if (this.el.shadow) {
            this.shadow = this.el.shadow.el;
        }
        
        if (this.component.isVisible()) {
            this.startMonitoring();
        }
    },
    
    setDisabled : function (disable) {
        this[disable ? "disable" : "enable"]();
    },

    disable : function () {
        this.disabled = true;
        if (this.opacity) {
            this.el.setOpacity(1);
        }
    },

    enable : function () {
        this.disabled = false;
    },
    
    getDistance : function (xy) {
        var x = xy[0],
            y = xy[1],
            distance,
            el;            
        
        Ext.each(this.getSensorEls(), function (sensorEl) {                
            if (!sensorEl) {
                return true;
            }
            
            var box = sensorEl.getBox();
            
            if (x >= box.x && x <= box.right && y >= box.y && y <= box.bottom) {
                distance = 0;
                el = sensorEl;
                
                return false;
            } 
            
            if (y > box.bottom) {
                y = box.y - y + box.bottom;
            }
            
            if (x > box.right) {
                x = box.x - x + box.right;
            }
            
            if (x > box.x) {
                distance = Math.abs(box.y - y);
                
                if (distance <= this.threshold) {                            
                    el = sensorEl;
                    
                    return false;
                }
                
                return true;
            }
            
            if (y > box.y) {
                distance = Math.abs(box.x - x);
                
                if (distance <= this.threshold) {                            
                    el = sensorEl;
                    
                    return false;
                }
                
                return true;
            }
            
            distance = Math.abs(Math.round(Math.sqrt(Math.pow(box.y - y, 2) + Math.pow(box.x - x, 2))));
            
            if (distance <= this.threshold) {                            
                el = sensorEl;
                
                return false;
            }
            
            return true;
        }, this);
        
        return { distance : distance, sensorEl : el };
    },
    
    isOutConstrain : function (xy) {
        var cEls = this.getConstrainEls(),
            out = true,
            box,
            x = xy[0],
            y = xy[1];
        
        if (!cEls) {
            return false;
        }
        
        Ext.each(cEls, function (el) {
            if (!el) {
                return;
            }
            
            box = el.getBox();
            
            if (x >= box.x && x <= box.right && y >= box.y && y <= box.bottom) {                        
                out = false;
                
                return false;
            } 
            
            return true;
        }, this);                
        
        return out;
    },

    onMouseMove : function () {
        if (this.disabled) { 
            return;
        }
        
        if (this.isOutConstrain(this._xy)) {
            if (this.state !== "far") {
                this.state = "far";
                this.fireEvent("far", this);
            }

            return;
        }
        
        var dObj = this.getDistance(this._xy);
        
        if (dObj.distance > this.threshold) {
            if (this.state !== "far") {
                this.state = "far";
                this.fireEvent("far", this);
            }
        } else {                        
            if (this.state !== "near") {
                this.state = "near";
                this.fireEvent("near", this, dObj.sensorEl);
            }
            
            this.fireEvent("distance", this, dObj.distance, 1 - (dObj.distance / this.threshold), dObj.sensorEl);
        }

        if (this.opacity) {
            var opacity = this.maxOpacity;
                
            if (dObj.distance > this.threshold) {
                opacity = this.minOpacity;
                this.el.setOpacity(opacity);
            } else {                        
                if (!this.component.isVisible()) {
                    this.component.show();
                }
                
                opacity = 1 - (dObj.distance / this.threshold);
                opacity = Math.min(opacity, this.maxOpacity);
                opacity = Math.max(opacity, this.minOpacity);
                
                this.el.setOpacity(opacity);                
            }
            
            this.opacityFixer(opacity);
            
            if (this.shadow) {
                this.shadow.setOpacity(opacity);
            }
        }
    },   
    
    opacityFixer : function (opacity) {
        if (Ext.isIE && this.component instanceof Ext.Window && opacity > 0) {
            var resizeHandles = this.component.el.select(".x-resizable-handle.x-window-handle");

            resizeHandles.each(function (rh) {
                rh.setStyle("filter", "none");
                rh.setStyle("background", "none");
            });
        }
    },

    startMonitoring : function () {
        if (this.disabled || this.monitoring || !this.el) {                
            return;
        }
        
        if(this.opacity){            
            this.el.setOpacity(this.minOpacity);            
            this.opacityFixer(this.minOpacity);
        }
        
        Ext.getDoc().on("mousemove", this.bufMouseMove, this);
        this.monitoring = true;
    },

    bufMouseMove : function (e) {
        this._xy = e.getXY();
        this.onMouseMove();
    },

    stopMonitoring : function () {
        if (this.disabled || !this.monitoring || !this.el) {                
            return;
        }
        
        Ext.getDoc().un("mousemove", this.bufMouseMove, this);
        this.monitoring = false;
    }
});







var SWFUpload;
var swfobject;

if (SWFUpload == undefined) {
	SWFUpload = function (settings) {
		this.initSWFUpload(settings);
	};
}

SWFUpload.prototype.initSWFUpload = function (userSettings) {
	try {
		this.customSettings = {};	// A container where developers can place their own settings associated with this instance.
		this.settings = {};
		this.eventQueue = [];
		this.movieName = "SWFUpload_" + SWFUpload.movieCount++;
		this.movieElement = null;


		// Setup global control tracking
		SWFUpload.instances[this.movieName] = this;

		// Load the settings.  Load the Flash movie.
		this.initSettings(userSettings);
		this.loadSupport();
		if (this.swfuploadPreload()) {
			this.loadFlash();
		}

		this.displayDebugInfo();
	} catch (ex) {
		delete SWFUpload.instances[this.movieName];
		throw ex;
	}
};




SWFUpload.instances = {};
SWFUpload.movieCount = 0;
SWFUpload.version = "2.5.0 2010-01-15 Beta 2";
SWFUpload.QUEUE_ERROR = {
	QUEUE_LIMIT_EXCEEDED            : -100,
	FILE_EXCEEDS_SIZE_LIMIT         : -110,
	ZERO_BYTE_FILE                  : -120,
	INVALID_FILETYPE                : -130
};
SWFUpload.UPLOAD_ERROR = {
	HTTP_ERROR                      : -200,
	MISSING_UPLOAD_URL              : -210,
	IO_ERROR                        : -220,
	SECURITY_ERROR                  : -230,
	UPLOAD_LIMIT_EXCEEDED           : -240,
	UPLOAD_FAILED                   : -250,
	SPECIFIED_FILE_ID_NOT_FOUND     : -260,
	FILE_VALIDATION_FAILED          : -270,
	FILE_CANCELLED                  : -280,
	UPLOAD_STOPPED                  : -290,
	RESIZE                          : -300
};
SWFUpload.FILE_STATUS = {
	QUEUED       : -1,
	IN_PROGRESS  : -2,
	ERROR        : -3,
	COMPLETE     : -4,
	CANCELLED    : -5
};
SWFUpload.UPLOAD_TYPE = {
	NORMAL       : -1,
	RESIZED      : -2
};

SWFUpload.BUTTON_ACTION = {
	SELECT_FILE             : -100,
	SELECT_FILES            : -110,
	START_UPLOAD            : -120,
	JAVASCRIPT              : -130,	// DEPRECATED
	NONE                    : -130
};
SWFUpload.CURSOR = {
	ARROW : -1,
	HAND  : -2
};
SWFUpload.WINDOW_MODE = {
	WINDOW       : "window",
	TRANSPARENT  : "transparent",
	OPAQUE       : "opaque"
};

SWFUpload.RESIZE_ENCODING = {
	JPEG  : -1,
	PNG   : -2
};

// Private: takes a URL, determines if it is relative and converts to an absolute URL
// using the current site. Only processes the URL if it can, otherwise returns the URL untouched
SWFUpload.completeURL = function (url) {
	try {
		var path = "", indexSlash = -1;
		if (typeof(url) !== "string" || url.match(/^https?:\/\//i) || url.match(/^\//) || url === "") {
			return url;
		}
		
		indexSlash = window.location.pathname.lastIndexOf("/");
		if (indexSlash <= 0) {
			path = "/";
		} else {
			path = window.location.pathname.substr(0, indexSlash) + "/";
		}
		
		return path + url;
	} catch (ex) {
		return url;
	}
};

// Public: assign a new function to onload to use swfobject's domLoad functionality
SWFUpload.onload = function () {};






// Private: initSettings ensures that all the
// settings are set, getting a default value if one was not assigned.
SWFUpload.prototype.initSettings = function (userSettings) {
	this.ensureDefault = function (settingName, defaultValue) {
		var setting = userSettings[settingName];
		if (setting != undefined) {
			this.settings[settingName] = setting;
		} else {
			this.settings[settingName] = defaultValue;
		}
	};
	
	// Upload backend settings
	this.ensureDefault("upload_url", "");
	this.ensureDefault("preserve_relative_urls", false);
	this.ensureDefault("file_post_name", "Filedata");
	this.ensureDefault("post_params", {});
	this.ensureDefault("use_query_string", false);
	this.ensureDefault("requeue_on_error", false);
	this.ensureDefault("http_success", []);
	this.ensureDefault("assume_success_timeout", 0);
	
	// File Settings
	this.ensureDefault("file_types", "*.*");
	this.ensureDefault("file_types_description", "All Files");
	this.ensureDefault("file_size_limit", 0);	// Default zero means "unlimited"
	this.ensureDefault("file_upload_limit", 0);
	this.ensureDefault("file_queue_limit", 0);

	// Flash Settings
	this.ensureDefault("flash_url", "swfupload.swf");
	this.ensureDefault("flash9_url", "swfupload_fp9.swf");
	this.ensureDefault("prevent_swf_caching", true);
	
	// Button Settings
	this.ensureDefault("button_image_url", "");
	this.ensureDefault("button_width", 1);
	this.ensureDefault("button_height", 1);
	this.ensureDefault("button_text", "");
	this.ensureDefault("button_text_style", "color: #000000; font-size: 16pt;");
	this.ensureDefault("button_text_top_padding", 0);
	this.ensureDefault("button_text_left_padding", 0);
	this.ensureDefault("button_action", SWFUpload.BUTTON_ACTION.SELECT_FILES);
	this.ensureDefault("button_disabled", false);
	this.ensureDefault("button_placeholder_id", "");
	this.ensureDefault("button_placeholder", null);
	this.ensureDefault("button_cursor", SWFUpload.CURSOR.ARROW);
	this.ensureDefault("button_window_mode", SWFUpload.WINDOW_MODE.WINDOW);
	
	// Debug Settings
	this.ensureDefault("debug", false);
	this.settings.debug_enabled = this.settings.debug;	// Here to maintain v2 API
	
	// Event Handlers
	this.settings.return_upload_start_handler = this.returnUploadStart;
	this.ensureDefault("swfupload_preload_handler", null);
	this.ensureDefault("swfupload_load_failed_handler", null);
	this.ensureDefault("swfupload_loaded_handler", null);
	this.ensureDefault("file_dialog_start_handler", null);
	this.ensureDefault("file_queued_handler", null);
	this.ensureDefault("file_queue_error_handler", null);
	this.ensureDefault("file_dialog_complete_handler", null);
	
	this.ensureDefault("upload_resize_start_handler", null);
	this.ensureDefault("upload_start_handler", null);
	this.ensureDefault("upload_progress_handler", null);
	this.ensureDefault("upload_error_handler", null);
	this.ensureDefault("upload_success_handler", null);
	this.ensureDefault("upload_complete_handler", null);
	
	this.ensureDefault("mouse_click_handler", null);
	this.ensureDefault("mouse_out_handler", null);
	this.ensureDefault("mouse_over_handler", null);
	
	this.ensureDefault("debug_handler", this.debugMessage);

	this.ensureDefault("custom_settings", {});

	// Other settings
	this.customSettings = this.settings.custom_settings;
	
	// Update the flash url if needed
	if (!!this.settings.prevent_swf_caching) {
		this.settings.flash_url = this.settings.flash_url + (this.settings.flash_url.indexOf("?") < 0 ? "?" : "&") + "preventswfcaching=" + new Date().getTime();
		this.settings.flash9_url = this.settings.flash9_url + (this.settings.flash9_url.indexOf("?") < 0 ? "?" : "&") + "preventswfcaching=" + new Date().getTime();
	}
	
	if (!this.settings.preserve_relative_urls) {
		this.settings.upload_url = SWFUpload.completeURL(this.settings.upload_url);
		this.settings.button_image_url = SWFUpload.completeURL(this.settings.button_image_url);
	}
	
	delete this.ensureDefault;
};

// Initializes the supported functionality based the Flash Player version, state, and event that occur during initialization
SWFUpload.prototype.loadSupport = function () {
	this.support = {
		loading : swfobject.hasFlashPlayerVersion("9.0.28"),
		imageResize : swfobject.hasFlashPlayerVersion("10.0.0")
	};
	
};

// Private: loadFlash replaces the button_placeholder element with the flash movie.
SWFUpload.prototype.loadFlash = function () {
	var targetElement, tempParent, wrapperType, flashHTML, els;

	if (!this.support.loading) {
		this.queueEvent("swfupload_load_failed_handler", ["Flash Player doesn't support SWFUpload"]);
		return;
	}
	
	// Make sure an element with the ID we are going to use doesn't already exist
	if (document.getElementById(this.movieName) !== null) {
		this.support.loading = false;
		this.queueEvent("swfupload_load_failed_handler", ["Element ID already in use"]);
		return;
	}

	// Get the element where we will be placing the flash movie
	targetElement = document.getElementById(this.settings.button_placeholder_id) || this.settings.button_placeholder;

	if (targetElement == undefined) {
		this.support.loading = false;
		this.queueEvent("swfupload_load_failed_handler", ["button place holder not found"]);
		return;
	}

	wrapperType = (targetElement.currentStyle && targetElement.currentStyle["display"] || window.getComputedStyle && document.defaultView.getComputedStyle(targetElement, null).getPropertyValue("display")) !== "block" ? "span" : "div";
	
	// Append the container and load the flash
	tempParent = document.createElement(wrapperType);

	flashHTML = this.getFlashHTML();

	try {
		tempParent.innerHTML = flashHTML;	// Using innerHTML is non-standard but the only sensible way to dynamically add Flash in IE (and maybe other browsers)
	} catch (ex) {
		this.support.loading = false;
		this.queueEvent("swfupload_load_failed_handler", ["Exception loading Flash HTML into placeholder"]);
		return;
	}

	// Try to get the movie element immediately
	els = tempParent.getElementsByTagName("object");
	if (!els || els.length > 1 || els.length === 0) {
		this.support.loading = false;
		this.queueEvent("swfupload_load_failed_handler", ["Unable to find movie after adding to DOM"]);
		return;
	} else if (els.length === 1) {
		this.movieElement = els[0];
	}
	
	targetElement.parentNode.replaceChild(tempParent.firstChild, targetElement);

	// Fix IE Flash/Form bug
	if (window[this.movieName] == undefined) {
		window[this.movieName] = this.getMovieElement();
	}
};

// Private: getFlashHTML generates the object tag needed to embed the flash in to the document
SWFUpload.prototype.getFlashHTML = function (flashVersion) {
	// Flash Satay object syntax: http://www.alistapart.com/articles/flashsatay
	return ['<object id="', this.movieName, '" type="application/x-shockwave-flash" data="', (this.support.imageResize ? this.settings.flash_url : this.settings.flash9_url), '" width="', this.settings.button_width, '" height="', this.settings.button_height, '" class="swfupload">',
				'<param name="wmode" value="', this.settings.button_window_mode, '" />',
				'<param name="movie" value="', (this.support.imageResize ? this.settings.flash_url : this.settings.flash9_url), '" />',
				'<param name="quality" value="high" />',
				'<param name="allowScriptAccess" value="always" />',
				'<param name="flashvars" value="' + this.getFlashVars() + '" />',
				'</object>'].join("");
};

// Private: getFlashVars builds the parameter string that will be passed
// to flash in the flashvars param.
SWFUpload.prototype.getFlashVars = function () {
	// Build a string from the post param object
	var httpSuccessString, paramString;
	
	paramString = this.buildParamString();
	httpSuccessString = this.settings.http_success.join(",");
	
	// Build the parameter string
	return ["movieName=", encodeURIComponent(this.movieName),
			"&amp;uploadURL=", encodeURIComponent(this.settings.upload_url),
			"&amp;useQueryString=", encodeURIComponent(this.settings.use_query_string),
			"&amp;requeueOnError=", encodeURIComponent(this.settings.requeue_on_error),
			"&amp;httpSuccess=", encodeURIComponent(httpSuccessString),
			"&amp;assumeSuccessTimeout=", encodeURIComponent(this.settings.assume_success_timeout),
			"&amp;params=", encodeURIComponent(paramString),
			"&amp;filePostName=", encodeURIComponent(this.settings.file_post_name),
			"&amp;fileTypes=", encodeURIComponent(this.settings.file_types),
			"&amp;fileTypesDescription=", encodeURIComponent(this.settings.file_types_description),
			"&amp;fileSizeLimit=", encodeURIComponent(this.settings.file_size_limit),
			"&amp;fileUploadLimit=", encodeURIComponent(this.settings.file_upload_limit),
			"&amp;fileQueueLimit=", encodeURIComponent(this.settings.file_queue_limit),
			"&amp;debugEnabled=", encodeURIComponent(this.settings.debug_enabled),
			"&amp;buttonImageURL=", encodeURIComponent(this.settings.button_image_url),
			"&amp;buttonWidth=", encodeURIComponent(this.settings.button_width),
			"&amp;buttonHeight=", encodeURIComponent(this.settings.button_height),
			"&amp;buttonText=", encodeURIComponent(this.settings.button_text),
			"&amp;buttonTextTopPadding=", encodeURIComponent(this.settings.button_text_top_padding),
			"&amp;buttonTextLeftPadding=", encodeURIComponent(this.settings.button_text_left_padding),
			"&amp;buttonTextStyle=", encodeURIComponent(this.settings.button_text_style),
			"&amp;buttonAction=", encodeURIComponent(this.settings.button_action),
			"&amp;buttonDisabled=", encodeURIComponent(this.settings.button_disabled),
			"&amp;buttonCursor=", encodeURIComponent(this.settings.button_cursor)
		].join("");
};

// Public: get retrieves the DOM reference to the Flash element added by SWFUpload
// The element is cached after the first lookup
SWFUpload.prototype.getMovieElement = function () {
	if (this.movieElement == undefined) {
		this.movieElement = document.getElementById(this.movieName);
	}

	if (this.movieElement === null) {
		throw "Could not find Flash element";
	}
	
	return this.movieElement;
};

// Private: buildParamString takes the name/value pairs in the post_params setting object
// and joins them up in to a string formatted "name=value&amp;name=value"
SWFUpload.prototype.buildParamString = function () {
	var name, postParams, paramStringPairs = [];
	
	postParams = this.settings.post_params; 

	if (typeof(postParams) === "object") {
		for (name in postParams) {
			if (postParams.hasOwnProperty(name)) {
				paramStringPairs.push(encodeURIComponent(name.toString()) + "=" + encodeURIComponent(postParams[name].toString()));
			}
		}
	}

	return paramStringPairs.join("&amp;");
};

// Public: Used to remove a SWFUpload instance from the page. This method strives to remove
// all references to the SWF, and other objects so memory is properly freed.
// Returns true if everything was destroyed. Returns a false if a failure occurs leaving SWFUpload in an inconsistant state.
// Credits: Major improvements provided by steffen
SWFUpload.prototype.destroy = function () {
	var movieElement;
	
	try {
		// Make sure Flash is done before we try to remove it
		this.cancelUpload(null, false);
		
		movieElement = this.cleanUp();

		// Remove the SWFUpload DOM nodes
		if (movieElement) {
			// Remove the Movie Element from the page
			try {
				movieElement.parentNode.removeChild(movieElement);
			} catch (ex) {}
		}

		// Remove IE form fix reference
		window[this.movieName] = null;

		// Destroy other references
		SWFUpload.instances[this.movieName] = null;
		delete SWFUpload.instances[this.movieName];

		this.movieElement = null;
		this.settings = null;
		this.customSettings = null;
		this.eventQueue = null;
		this.movieName = null;
		
		
		return true;
	} catch (ex2) {
		return false;
	}
};


// Public: displayDebugInfo prints out settings and configuration
// information about this SWFUpload instance.
// This function (and any references to it) can be deleted when placing
// SWFUpload in production.
SWFUpload.prototype.displayDebugInfo = function () {
	this.debug(
		[
			"---SWFUpload Instance Info---\n",
			"Version: ", SWFUpload.version, "\n",
			"Movie Name: ", this.movieName, "\n",
			"Settings:\n",
			"\t", "upload_url:               ", this.settings.upload_url, "\n",
			"\t", "flash_url:                ", this.settings.flash_url, "\n",
			"\t", "flash9_url:                ", this.settings.flash9_url, "\n",
			"\t", "use_query_string:         ", this.settings.use_query_string.toString(), "\n",
			"\t", "requeue_on_error:         ", this.settings.requeue_on_error.toString(), "\n",
			"\t", "http_success:             ", this.settings.http_success.join(", "), "\n",
			"\t", "assume_success_timeout:   ", this.settings.assume_success_timeout, "\n",
			"\t", "file_post_name:           ", this.settings.file_post_name, "\n",
			"\t", "post_params:              ", this.settings.post_params.toString(), "\n",
			"\t", "file_types:               ", this.settings.file_types, "\n",
			"\t", "file_types_description:   ", this.settings.file_types_description, "\n",
			"\t", "file_size_limit:          ", this.settings.file_size_limit, "\n",
			"\t", "file_upload_limit:        ", this.settings.file_upload_limit, "\n",
			"\t", "file_queue_limit:         ", this.settings.file_queue_limit, "\n",
			"\t", "debug:                    ", this.settings.debug.toString(), "\n",

			"\t", "prevent_swf_caching:      ", this.settings.prevent_swf_caching.toString(), "\n",

			"\t", "button_placeholder_id:    ", this.settings.button_placeholder_id.toString(), "\n",
			"\t", "button_placeholder:       ", (this.settings.button_placeholder ? "Set" : "Not Set"), "\n",
			"\t", "button_image_url:         ", this.settings.button_image_url.toString(), "\n",
			"\t", "button_width:             ", this.settings.button_width.toString(), "\n",
			"\t", "button_height:            ", this.settings.button_height.toString(), "\n",
			"\t", "button_text:              ", this.settings.button_text.toString(), "\n",
			"\t", "button_text_style:        ", this.settings.button_text_style.toString(), "\n",
			"\t", "button_text_top_padding:  ", this.settings.button_text_top_padding.toString(), "\n",
			"\t", "button_text_left_padding: ", this.settings.button_text_left_padding.toString(), "\n",
			"\t", "button_action:            ", this.settings.button_action.toString(), "\n",
			"\t", "button_cursor:            ", this.settings.button_cursor.toString(), "\n",
			"\t", "button_disabled:          ", this.settings.button_disabled.toString(), "\n",

			"\t", "custom_settings:          ", this.settings.custom_settings.toString(), "\n",
			"Event Handlers:\n",
			"\t", "swfupload_preload_handler assigned:  ", (typeof this.settings.swfupload_preload_handler === "function").toString(), "\n",
			"\t", "swfupload_load_failed_handler assigned:  ", (typeof this.settings.swfupload_load_failed_handler === "function").toString(), "\n",
			"\t", "swfupload_loaded_handler assigned:  ", (typeof this.settings.swfupload_loaded_handler === "function").toString(), "\n",
			"\t", "mouse_click_handler assigned:       ", (typeof this.settings.mouse_click_handler === "function").toString(), "\n",
			"\t", "mouse_over_handler assigned:        ", (typeof this.settings.mouse_over_handler === "function").toString(), "\n",
			"\t", "mouse_out_handler assigned:         ", (typeof this.settings.mouse_out_handler === "function").toString(), "\n",
			"\t", "file_dialog_start_handler assigned: ", (typeof this.settings.file_dialog_start_handler === "function").toString(), "\n",
			"\t", "file_queued_handler assigned:       ", (typeof this.settings.file_queued_handler === "function").toString(), "\n",
			"\t", "file_queue_error_handler assigned:  ", (typeof this.settings.file_queue_error_handler === "function").toString(), "\n",
			"\t", "upload_resize_start_handler assigned:      ", (typeof this.settings.upload_resize_start_handler === "function").toString(), "\n",
			"\t", "upload_start_handler assigned:      ", (typeof this.settings.upload_start_handler === "function").toString(), "\n",
			"\t", "upload_progress_handler assigned:   ", (typeof this.settings.upload_progress_handler === "function").toString(), "\n",
			"\t", "upload_error_handler assigned:      ", (typeof this.settings.upload_error_handler === "function").toString(), "\n",
			"\t", "upload_success_handler assigned:    ", (typeof this.settings.upload_success_handler === "function").toString(), "\n",
			"\t", "upload_complete_handler assigned:   ", (typeof this.settings.upload_complete_handler === "function").toString(), "\n",
			"\t", "debug_handler assigned:             ", (typeof this.settings.debug_handler === "function").toString(), "\n",

			"Support:\n",
			"\t", "Load:                     ", (this.support.loading ? "Yes" : "No"), "\n",
			"\t", "Image Resize:             ", (this.support.imageResize ? "Yes" : "No"), "\n"

		].join("")
	);
};


// Public: (Deprecated) addSetting adds a setting value. If the value given is undefined or null then the default_value is used.
SWFUpload.prototype.addSetting = function (name, value, default_value) {
    if (value == undefined) {
        return (this.settings[name] = default_value);
    } else {
        return (this.settings[name] = value);
	}
};

// Public: (Deprecated) getSetting gets a setting. Returns an empty string if the setting was not found.
SWFUpload.prototype.getSetting = function (name) {
    if (this.settings[name] != undefined) {
        return this.settings[name];
	}

    return "";
};



// Private: callFlash handles function calls made to the Flash element.
// Calls are made with a setTimeout for some functions to work around
// bugs in the ExternalInterface library.
SWFUpload.prototype.callFlash = function (functionName, argumentArray) {
	var movieElement, returnValue, returnString;
	
	argumentArray = argumentArray || [];
	movieElement = this.getMovieElement();

	// Flash's method if calling ExternalInterface methods (code adapted from MooTools).
	try {
		if (movieElement != undefined) {
			returnString = movieElement.CallFunction('<invoke name="' + functionName + '" returntype="javascript">' + __flash__argumentsToXML(argumentArray, 0) + '</invoke>');
			returnValue = eval(returnString);
		} else {
			this.debug("Can't call flash because the movie wasn't found.");
		}
	} catch (ex) {
		this.debug("Exception calling flash function '" + functionName + "': " + ex.message);
	}
	
	// Unescape file post param values
	if (returnValue != undefined && typeof returnValue.post === "object") {
		returnValue = this.unescapeFilePostParams(returnValue);
	}

	return returnValue;
};



// WARNING: this function does not work in Flash Player 10
// Public: selectFile causes a File Selection Dialog window to appear.  This
// dialog only allows 1 file to be selected.
SWFUpload.prototype.selectFile = function () {
	this.callFlash("SelectFile");
};

// WARNING: this function does not work in Flash Player 10
// Public: selectFiles causes a File Selection Dialog window to appear/ This
// dialog allows the user to select any number of files
// Flash Bug Warning: Flash limits the number of selectable files based on the combined length of the file names.
// If the selection name length is too long the dialog will fail in an unpredictable manner.  There is no work-around
// for this bug.
SWFUpload.prototype.selectFiles = function () {
	this.callFlash("SelectFiles");
};


// Public: startUpload starts uploading the first file in the queue unless
// the optional parameter 'fileID' specifies the ID 
SWFUpload.prototype.startUpload = function (fileID) {
	this.callFlash("StartUpload", [fileID]);
};

// Public: startUpload starts uploading the first file in the queue unless
// the optional parameter 'fileID' specifies the ID 
SWFUpload.prototype.startResizedUpload = function (fileID, width, height, encoding, quality, allowEnlarging) {
	this.callFlash("StartUpload", [fileID, { "width": width, "height" : height, "encoding" : encoding, "quality" : quality, "allowEnlarging" : allowEnlarging }]);
};

// Public: cancelUpload cancels any queued file.  The fileID parameter may be the file ID or index.
// If you do not specify a fileID the current uploading file or first file in the queue is cancelled.
// If you do not want the uploadError event to trigger you can specify false for the triggerErrorEvent parameter.
SWFUpload.prototype.cancelUpload = function (fileID, triggerErrorEvent) {
	if (triggerErrorEvent !== false) {
		triggerErrorEvent = true;
	}
	this.callFlash("CancelUpload", [fileID, triggerErrorEvent]);
};

// Public: stopUpload stops the current upload and requeues the file at the beginning of the queue.
// If nothing is currently uploading then nothing happens.
SWFUpload.prototype.stopUpload = function () {
	this.callFlash("StopUpload");
};


// Public: requeueUpload requeues any file. If the file is requeued or already queued true is returned.
// If the file is not found or is currently uploading false is returned.  Requeuing a file bypasses the
// file size, queue size, upload limit and other queue checks.  Certain files can't be requeued (e.g, invalid or zero bytes files).
SWFUpload.prototype.requeueUpload = function (indexOrFileID) {
	return this.callFlash("RequeueUpload", [indexOrFileID]);
};




// Public: getStats gets the file statistics object.
SWFUpload.prototype.getStats = function () {
	return this.callFlash("GetStats");
};

// Public: setStats changes the SWFUpload statistics.  You shouldn't need to 
// change the statistics but you can.  Changing the statistics does not
// affect SWFUpload accept for the successful_uploads count which is used
// by the upload_limit setting to determine how many files the user may upload.
SWFUpload.prototype.setStats = function (statsObject) {
	this.callFlash("SetStats", [statsObject]);
};

// Public: getFile retrieves a File object by ID or Index.  If the file is
// not found then 'null' is returned.
SWFUpload.prototype.getFile = function (fileID) {
	if (typeof(fileID) === "number") {
		return this.callFlash("GetFileByIndex", [fileID]);
	} else {
		return this.callFlash("GetFile", [fileID]);
	}
};

// Public: getFileFromQueue retrieves a File object by ID or Index.  If the file is
// not found then 'null' is returned.
SWFUpload.prototype.getQueueFile = function (fileID) {
	if (typeof(fileID) === "number") {
		return this.callFlash("GetFileByQueueIndex", [fileID]);
	} else {
		return this.callFlash("GetFile", [fileID]);
	}
};


// Public: addFileParam sets a name/value pair that will be posted with the
// file specified by the Files ID.  If the name already exists then the
// exiting value will be overwritten.
SWFUpload.prototype.addFileParam = function (fileID, name, value) {
	return this.callFlash("AddFileParam", [fileID, name, value]);
};

// Public: removeFileParam removes a previously set (by addFileParam) name/value
// pair from the specified file.
SWFUpload.prototype.removeFileParam = function (fileID, name) {
	this.callFlash("RemoveFileParam", [fileID, name]);
};

// Public: setUploadUrl changes the upload_url setting.
SWFUpload.prototype.setUploadURL = function (url) {
	this.settings.upload_url = url.toString();
	this.callFlash("SetUploadURL", [url]);
};

// Public: setPostParams changes the post_params setting
SWFUpload.prototype.setPostParams = function (paramsObject) {
	this.settings.post_params = paramsObject;
	this.callFlash("SetPostParams", [paramsObject]);
};

// Public: addPostParam adds post name/value pair.  Each name can have only one value.
SWFUpload.prototype.addPostParam = function (name, value) {
	this.settings.post_params[name] = value;
	this.callFlash("SetPostParams", [this.settings.post_params]);
};

// Public: removePostParam deletes post name/value pair.
SWFUpload.prototype.removePostParam = function (name) {
	delete this.settings.post_params[name];
	this.callFlash("SetPostParams", [this.settings.post_params]);
};

// Public: setFileTypes changes the file_types setting and the file_types_description setting
SWFUpload.prototype.setFileTypes = function (types, description) {
	this.settings.file_types = types;
	this.settings.file_types_description = description;
	this.callFlash("SetFileTypes", [types, description]);
};

// Public: setFileSizeLimit changes the file_size_limit setting
SWFUpload.prototype.setFileSizeLimit = function (fileSizeLimit) {
	this.settings.file_size_limit = fileSizeLimit;
	this.callFlash("SetFileSizeLimit", [fileSizeLimit]);
};

// Public: setFileUploadLimit changes the file_upload_limit setting
SWFUpload.prototype.setFileUploadLimit = function (fileUploadLimit) {
	this.settings.file_upload_limit = fileUploadLimit;
	this.callFlash("SetFileUploadLimit", [fileUploadLimit]);
};

// Public: setFileQueueLimit changes the file_queue_limit setting
SWFUpload.prototype.setFileQueueLimit = function (fileQueueLimit) {
	this.settings.file_queue_limit = fileQueueLimit;
	this.callFlash("SetFileQueueLimit", [fileQueueLimit]);
};

// Public: setFilePostName changes the file_post_name setting
SWFUpload.prototype.setFilePostName = function (filePostName) {
	this.settings.file_post_name = filePostName;
	this.callFlash("SetFilePostName", [filePostName]);
};

// Public: setUseQueryString changes the use_query_string setting
SWFUpload.prototype.setUseQueryString = function (useQueryString) {
	this.settings.use_query_string = useQueryString;
	this.callFlash("SetUseQueryString", [useQueryString]);
};

// Public: setRequeueOnError changes the requeue_on_error setting
SWFUpload.prototype.setRequeueOnError = function (requeueOnError) {
	this.settings.requeue_on_error = requeueOnError;
	this.callFlash("SetRequeueOnError", [requeueOnError]);
};

// Public: setHTTPSuccess changes the http_success setting
SWFUpload.prototype.setHTTPSuccess = function (http_status_codes) {
	if (typeof http_status_codes === "string") {
		http_status_codes = http_status_codes.replace(" ", "").split(",");
	}
	
	this.settings.http_success = http_status_codes;
	this.callFlash("SetHTTPSuccess", [http_status_codes]);
};

// Public: setHTTPSuccess changes the http_success setting
SWFUpload.prototype.setAssumeSuccessTimeout = function (timeout_seconds) {
	this.settings.assume_success_timeout = timeout_seconds;
	this.callFlash("SetAssumeSuccessTimeout", [timeout_seconds]);
};

// Public: setDebugEnabled changes the debug_enabled setting
SWFUpload.prototype.setDebugEnabled = function (debugEnabled) {
	this.settings.debug_enabled = debugEnabled;
	this.callFlash("SetDebugEnabled", [debugEnabled]);
};

// Public: setButtonImageURL loads a button image sprite
SWFUpload.prototype.setButtonImageURL = function (buttonImageURL) {
	if (buttonImageURL == undefined) {
		buttonImageURL = "";
	}
	
	this.settings.button_image_url = buttonImageURL;
	this.callFlash("SetButtonImageURL", [buttonImageURL]);
};

// Public: setButtonDimensions resizes the Flash Movie and button
SWFUpload.prototype.setButtonDimensions = function (width, height) {
	this.settings.button_width = width;
	this.settings.button_height = height;
	
	var movie = this.getMovieElement();
	if (movie != undefined) {
		movie.style.width = width + "px";
		movie.style.height = height + "px";
	}
	
	this.callFlash("SetButtonDimensions", [width, height]);
};
// Public: setButtonText Changes the text overlaid on the button
SWFUpload.prototype.setButtonText = function (html) {
	this.settings.button_text = html;
	this.callFlash("SetButtonText", [html]);
};
// Public: setButtonTextPadding changes the top and left padding of the text overlay
SWFUpload.prototype.setButtonTextPadding = function (left, top) {
	this.settings.button_text_top_padding = top;
	this.settings.button_text_left_padding = left;
	this.callFlash("SetButtonTextPadding", [left, top]);
};

// Public: setButtonTextStyle changes the CSS used to style the HTML/Text overlaid on the button
SWFUpload.prototype.setButtonTextStyle = function (css) {
	this.settings.button_text_style = css;
	this.callFlash("SetButtonTextStyle", [css]);
};
// Public: setButtonDisabled disables/enables the button
SWFUpload.prototype.setButtonDisabled = function (isDisabled) {
	this.settings.button_disabled = isDisabled;
	this.callFlash("SetButtonDisabled", [isDisabled]);
};
// Public: setButtonAction sets the action that occurs when the button is clicked
SWFUpload.prototype.setButtonAction = function (buttonAction) {
	this.settings.button_action = buttonAction;
	this.callFlash("SetButtonAction", [buttonAction]);
};

// Public: setButtonCursor changes the mouse cursor displayed when hovering over the button
SWFUpload.prototype.setButtonCursor = function (cursor) {
	this.settings.button_cursor = cursor;
	this.callFlash("SetButtonCursor", [cursor]);
};



SWFUpload.prototype.queueEvent = function (handlerName, argumentArray) {
	// Warning: Don't call this.debug inside here or you'll create an infinite loop
	var self = this;
	
	if (argumentArray == undefined) {
		argumentArray = [];
	} else if (!(argumentArray instanceof Array)) {
		argumentArray = [argumentArray];
	}
	
	if (typeof this.settings[handlerName] === "function") {
		// Queue the event
		this.eventQueue.push(function () {
			this.settings[handlerName].apply(this, argumentArray);
		});
		
		// Execute the next queued event
		setTimeout(function () {
			self.executeNextEvent();
		}, 0);
		
	} else if (this.settings[handlerName] !== null) {
		throw "Event handler " + handlerName + " is unknown or is not a function";
	}
};

// Private: Causes the next event in the queue to be executed.  Since events are queued using a setTimeout
// we must queue them in order to garentee that they are executed in order.
SWFUpload.prototype.executeNextEvent = function () {
	// Warning: Don't call this.debug inside here or you'll create an infinite loop

	var  f = this.eventQueue ? this.eventQueue.shift() : null;
	if (typeof(f) === "function") {
		f.apply(this);
	}
};

// Private: unescapeFileParams is part of a workaround for a flash bug where objects passed through ExternalInterface cannot have
// properties that contain characters that are not valid for JavaScript identifiers. To work around this
// the Flash Component escapes the parameter names and we must unescape again before passing them along.
SWFUpload.prototype.unescapeFilePostParams = function (file) {
	var reg = /[$]([0-9a-f]{4})/i, unescapedPost = {}, uk, k, match;

	if (file != undefined) {
		for (k in file.post) {
			if (file.post.hasOwnProperty(k)) {
				uk = k;
				while ((match = reg.exec(uk)) !== null) {
					uk = uk.replace(match[0], String.fromCharCode(parseInt("0x" + match[1], 16)));
				}
				unescapedPost[uk] = file.post[k];
			}
		}

		file.post = unescapedPost;
	}

	return file;
};

// Private: This event is called by SWFUpload Init after we've determined what the user's Flash Player supports.
// Use the swfupload_preload_handler event setting to execute custom code when SWFUpload has loaded.
// Return false to prevent SWFUpload from loading and allow your script to do something else if your required feature is
// not supported
SWFUpload.prototype.swfuploadPreload = function () {
	var returnValue;
	if (typeof this.settings.swfupload_preload_handler === "function") {
		returnValue = this.settings.swfupload_preload_handler.call(this);
	} else if (this.settings.swfupload_preload_handler != undefined) {
		throw "upload_start_handler must be a function";
	}

	// Convert undefined to true so if nothing is returned from the upload_start_handler it is
	// interpretted as 'true'.
	if (returnValue === undefined) {
		returnValue = true;
	}
	
	return !!returnValue;
}

// Private: This event is called by Flash when it has finished loading. Don't modify this.
// Use the swfupload_loaded_handler event setting to execute custom code when SWFUpload has loaded.
SWFUpload.prototype.flashReady = function () {
	// Check that the movie element is loaded correctly with its ExternalInterface methods defined
	var movieElement = 	this.cleanUp();

	if (!movieElement) {
		this.debug("Flash called back ready but the flash movie can't be found.");
		return;
	}

	this.queueEvent("swfupload_loaded_handler");
};

// Private: removes Flash added fuctions to the DOM node to prevent memory leaks in IE.
// This function is called by Flash each time the ExternalInterface functions are created.
SWFUpload.prototype.cleanUp = function () {
	var key, movieElement = this.getMovieElement();
	
	// Pro-actively unhook all the Flash functions
	try {
		if (movieElement && typeof(movieElement.CallFunction) === "unknown") { // We only want to do this in IE
			this.debug("Removing Flash functions hooks (this should only run in IE and should prevent memory leaks)");
			for (key in movieElement) {
				try {
					if (typeof(movieElement[key]) === "function") {
						movieElement[key] = null;
					}
				} catch (ex) {
				}
			}
		}
	} catch (ex1) {
	
	}

	// Fix Flashes own cleanup code so if the SWF Movie was removed from the page
	// it doesn't display errors.
	window["__flash__removeCallback"] = function (instance, name) {
		try {
			if (instance) {
				instance[name] = null;
			}
		} catch (flashEx) {
		
		}
	};
	
	return movieElement;
};


SWFUpload.prototype.mouseClick = function () {
	this.queueEvent("mouse_click_handler");
};
SWFUpload.prototype.mouseOver = function () {
	this.queueEvent("mouse_over_handler");
};
SWFUpload.prototype.mouseOut = function () {
	this.queueEvent("mouse_out_handler");
};


SWFUpload.prototype.fileDialogStart = function () {
	this.queueEvent("file_dialog_start_handler");
};



SWFUpload.prototype.fileQueued = function (file) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("file_queued_handler", file);
};



SWFUpload.prototype.fileQueueError = function (file, errorCode, message) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("file_queue_error_handler", [file, errorCode, message]);
};


SWFUpload.prototype.fileDialogComplete = function (numFilesSelected, numFilesQueued, numFilesInQueue) {
	this.queueEvent("file_dialog_complete_handler", [numFilesSelected, numFilesQueued, numFilesInQueue]);
};

SWFUpload.prototype.uploadResizeStart = function (file, resizeSettings) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("upload_resize_start_handler", [file, resizeSettings.width, resizeSettings.height, resizeSettings.encoding, resizeSettings.quality]);
};

SWFUpload.prototype.uploadStart = function (file) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("return_upload_start_handler", file);
};

SWFUpload.prototype.returnUploadStart = function (file) {
	var returnValue;
	if (typeof this.settings.upload_start_handler === "function") {
		file = this.unescapeFilePostParams(file);
		returnValue = this.settings.upload_start_handler.call(this, file);
	} else if (this.settings.upload_start_handler != undefined) {
		throw "upload_start_handler must be a function";
	}

	// Convert undefined to true so if nothing is returned from the upload_start_handler it is
	// interpretted as 'true'.
	if (returnValue === undefined) {
		returnValue = true;
	}
	
	returnValue = !!returnValue;
	
	this.callFlash("ReturnUploadStart", [returnValue]);
};



SWFUpload.prototype.uploadProgress = function (file, bytesComplete, bytesTotal) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("upload_progress_handler", [file, bytesComplete, bytesTotal]);
};

SWFUpload.prototype.uploadError = function (file, errorCode, message) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("upload_error_handler", [file, errorCode, message]);
};

SWFUpload.prototype.uploadSuccess = function (file, serverData, responseReceived) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("upload_success_handler", [file, serverData, responseReceived]);
};

SWFUpload.prototype.uploadComplete = function (file) {
	file = this.unescapeFilePostParams(file);
	this.queueEvent("upload_complete_handler", file);
};


SWFUpload.prototype.debug = function (message) {
	this.queueEvent("debug_handler", message);
};



   
// Private: debugMessage is the default debug_handler.  If you want to print debug messages
// call the debug() function.  When overriding the function your own function should
// check to see if the debug setting is true before outputting debug information.
SWFUpload.prototype.debugMessage = function (message) {
	var exceptionMessage, exceptionValues, key;

	if (this.settings.debug) {
		exceptionValues = [];

		// Check for an exception object and print it nicely
		if (typeof message === "object" && typeof message.name === "string" && typeof message.message === "string") {
			for (key in message) {
				if (message.hasOwnProperty(key)) {
					exceptionValues.push(key + ": " + message[key]);
				}
			}
			exceptionMessage = exceptionValues.join("\n") || "";
			exceptionValues = exceptionMessage.split("\n");
			exceptionMessage = "EXCEPTION: " + exceptionValues.join("\nEXCEPTION: ");
			SWFUpload.Console.writeLine(exceptionMessage);
		} else {
			SWFUpload.Console.writeLine(message);
		}
	}
};

SWFUpload.Console = {};
SWFUpload.Console.writeLine = function (message) {
	var console, documentForm;

	try {
		console = document.getElementById("SWFUpload_Console");

		if (!console) {
			documentForm = document.createElement("form");
			document.getElementsByTagName("body")[0].appendChild(documentForm);

			console = document.createElement("textarea");
			console.id = "SWFUpload_Console";
			console.style.fontFamily = "monospace";
			console.setAttribute("wrap", "off");
			console.wrap = "off";
			console.style.overflow = "auto";
			console.style.width = "700px";
			console.style.height = "350px";
			console.style.margin = "5px";
			documentForm.appendChild(console);
		}

		console.value += message + "\n";

		console.scrollTop = console.scrollHeight - console.clientHeight;
	} catch (ex) {
		alert("Exception: " + ex.name + " Message: " + ex.message);
	}
};



swfobject = function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O.ActiveXObject!=D){try{var ad=new ActiveXObject(W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?"ActiveX":"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();
swfobject.addDomLoadEvent(function () {
	if (typeof(SWFUpload.onload) === "function") {
		SWFUpload.onload.call(window);
	}
});



var SWFUpload;
if (typeof(SWFUpload) === "function") {
	SWFUpload.queue = {};
	
	SWFUpload.prototype.initSettings = (function (oldInitSettings) {
		return function (userSettings) {
			if (typeof(oldInitSettings) === "function") {
				oldInitSettings.call(this, userSettings);
			}
			
			this.queueSettings = {};
			
			this.queueSettings.queue_cancelled_flag = false;
			this.queueSettings.queue_upload_count = 0;
			
			this.queueSettings.user_upload_complete_handler = this.settings.upload_complete_handler;
			this.queueSettings.user_upload_start_handler = this.settings.upload_start_handler;
			this.settings.upload_complete_handler = SWFUpload.queue.uploadCompleteHandler;
			this.settings.upload_start_handler = SWFUpload.queue.uploadStartHandler;
			
			this.settings.queue_complete_handler = userSettings.queue_complete_handler || null;
		};
	})(SWFUpload.prototype.initSettings);

	SWFUpload.prototype.startUpload = function (fileID) {
		this.queueSettings.queue_cancelled_flag = false;
		this.callFlash("StartUpload", [fileID]);
	};

	SWFUpload.prototype.cancelQueue = function () {
		this.queueSettings.queue_cancelled_flag = true;
		this.stopUpload();
		
		var stats = this.getStats();
		while (stats.files_queued > 0) {
			this.cancelUpload();
			stats = this.getStats();
		}
	};
	
	SWFUpload.queue.uploadStartHandler = function (file) {
		var returnValue;
		if (typeof(this.queueSettings.user_upload_start_handler) === "function") {
			returnValue = this.queueSettings.user_upload_start_handler.call(this, file);
		}
		
		// To prevent upload a real "FALSE" value must be returned, otherwise default to a real "TRUE" value.
		returnValue = (returnValue === false) ? false : true;
		
		this.queueSettings.queue_cancelled_flag = !returnValue;

		return returnValue;
	};
	
	SWFUpload.queue.uploadCompleteHandler = function (file) {
		var user_upload_complete_handler = this.queueSettings.user_upload_complete_handler;
		var continueUpload;
		
		if (file.filestatus === SWFUpload.FILE_STATUS.COMPLETE) {
			this.queueSettings.queue_upload_count++;
		}

		if (typeof(user_upload_complete_handler) === "function") {
			continueUpload = (user_upload_complete_handler.call(this, file) === false) ? false : true;
		} else if (file.filestatus === SWFUpload.FILE_STATUS.QUEUED) {
			// If the file was stopped and re-queued don't restart the upload
			continueUpload = false;
		} else {
			continueUpload = true;
		}
		
		if (continueUpload) {
			var stats = this.getStats();
			if (stats.files_queued > 0 && this.queueSettings.queue_cancelled_flag === false) {
				this.startUpload();
			} else if (this.queueSettings.queue_cancelled_flag === false) {
				this.queueEvent("queue_complete_handler", [this.queueSettings.queue_upload_count]);
				this.queueSettings.queue_upload_count = 0;
			} else {
				this.queueSettings.queue_cancelled_flag = false;
				this.queueSettings.queue_upload_count = 0;
			}
		}
	};
}
Ext.define("Ext.net.MultiUpload", {
    extend: "Ext.Component",
    alias: "widget.multiupload",

    autoStartUpload : false,
	fileDropAnywhere : false,
    //dragDropElement
	
    filePostName : "Filedata",
	disableFlash : false,
    fileTypes : "*.*",
    fileTypesDescription : "All Files",
    fileSizeLimit : "2 MB",	
	fileId : 0,	
    fileUploadLimit : 0,
    fileQueueLimit : 0,
    fileSizeEventText : "File size exceeds allowed limit.",
    useQueryString : false,
    preserveRelativeUrls : false,
    requeueOnError : false,
    assumeSuccessTimeout : 0, 
    preventSwfCaching : true,
    debug: false,

    xhrUpload : {
        fileNameHeader : "X-File-Name",
		postParamsPrefix : "postParams_",
		filePostName : "Filedata"
         //uploadUrl : 'upload.aspx'
    },    

    renderTpl : ["<div style='position:relative;'><div class='x-swfplaceholder'></div></div>"],

	initComponent : function () {
        this.postParams = this.postParams || {};
        this.fileQueue = {};
        this.swfUploadQueue = {};
        this.httpSuccess = this.httpSuccess || [];

        if (!this.uploadUrl)
        {
            if (!Ext.isEmpty(Ext.net.ResourceMgr.aspForm)) {
                this.uploadUrl = Ext.get(Ext.net.ResourceMgr.aspForm).dom.action;
            }
            else {
                this.uploadUrl = window.location.href;
            }
        }
		
		this.addEvents(
            "swfuploadloaded",
			"swfuploadloadfailed",
            "swfuploadpreload",
            "filedialogstart",
            "filequeued",
            "filedialogcomplete",
            "uploadresizestart",
            "uploadstart",
            "uploadprogress",
            "uploaderror",
            "uploadsuccess",
            "uploadcomplete",
            "mouseout",
            "mouseover",
            "mouseclick",
            "debug",

            "fileselected",
			"fileselectionerror",
			"uploadremoved",
			"uploadaborted"            
		);
        		
		this.callParent(arguments);
	},

    getSizeLimit : function () {
        var size,
            unit,
            match,
            units,
            regex = /(\d+)\s*(B|KB|MB|GB)?/i;

        if (this.fileSizeLimit && Ext.isString(this.fileSizeLimit)) {
            match = this.fileSizeLimit.match(regex);               

            if (match != null) {
	            size = parseInt(match[1], 10);
                unit = (match[2] && match[2].toUpperCase()) || "KB";

                units = {
                    B  : 1,
                    KB : 1024,
                    MB : 1048576,
                    GB : 1073741824
                };

                return size * units[unit];
                
            } else {
	            return 0;
            }
        }

        return this.fileSizeLimit;
    },

    disable : function () {
        this.callParent(arguments);

        if (!this.flashButton)
        {
            if(this.button && this.button.rendered) {
                this.button.disable();
            }
        }
        else if (this.multiUpload) {
            this.multiUpload.setButtonDisabled(true);
        }
    },

    enable : function () {
        this.callParent(arguments);

        if (!this.flashButton)
        {
            if(this.button && this.button.rendered) {
                this.button.enable();
            }
        }
        else if (this.multiUpload) {
            this.multiUpload.setButtonDisabled(false);
        }
    },

    afterRender : function () {
        this.callParent(arguments);

        this.initSWFUpload();
        this.initDragAndDropUploader();
    },

	startUpload : function () {
		var fileId;
		for(fileId in this.fileQueue){
			if (this.fileQueue[fileId].status == "started") {
				continue;
			}

			switch (this.fileQueue[fileId].method) {
				case "swfupload":
					this.swfUploadStopped = false;

					if(this.fileQueue[fileId].status == "error" ){
						this.multiUpload.requeueUpload(this.fileQueue[fileId].swfuploadFile.id);
					}
					
					if (this.multiUpload.getStats().in_progress != 1) {
						this.swfUploadUploadStart();
					}
					
					break;

				case "dnd":
					this.dragAndDropUploadStart(this.fileQueue[fileId]);
					break;
			}
		}
	},

	abortAllUploads : function () {
		var fileId;
		for(fileId in this.fileQueue){
			this.abortUpload(this.fileQueue[fileId].id);
		}
	},

	abortUpload : function (fileId) {
	
		if (this.fileQueue[fileId].status == "started") {
		
			switch (this.fileQueue[fileId].method) {
				case "swfupload":
					this.swfUploadStopped = true;
					this.multiUpload.stopUpload();
					break;

				case "dnd":
					this.fileQueue[fileId].upload.xhr.abort();
					break;
			}

			this.fileQueue[fileId].status = "aborted";
			this.fireEvent("uploadaborted", this, this.fileQueue[fileId]);
		}
	},

	removeAllUploads : function () {
		for(var fileId in this.fileQueue){
			this.removeUpload(this.fileQueue[fileId].id);
		}
	},

	removeUpload : function (fileId) {
		if(this.fileQueue[fileId].status == "started"){
			this.abortUpload(fileId);
		}

		switch (this.fileQueue[fileId].method) {
			case "swfupload":
				this.multiUpload.cancelUpload(this.fileQueue[fileId].swfuploadFile.id, false);
				break;
		}
		
		this.fileQueue[fileId].status = "removed";

		var fileInfo = {
			id: fileId,
			name: this.fileQueue[fileId].name,
			size: this.fileQueue[fileId].size
		};

		delete this.fileQueue[fileId];
		this.fireEvent("uploadremoved", this, fileInfo);
	},

    beforeDestroy: function() {
        var me = this;

        if (me.multiUpload) {
            me.multiUpload.destroy();
            delete me.multiUpload;
        }

        if (me.button) {
            me.button.destroy();
            delete me.button;
        }
        me.callParent();
    },

	initSWFUpload : function () {
		var settings = {
			flash_url: this.flashUrl,
			upload_url: this.uploadUrl,
			file_size_limit: this.fileSizeLimit,
			file_types: this.fileTypes,
			file_types_description: this.fileTypesDescription,
			file_upload_limit: this.fileUploadLimit !== 0 ? this.fileUploadLimit + 1 : 0,
			file_queue_limit: this.fileQueueLimit,
			post_params: this.postParams,			
			button_window_mode: "opaque",
            button_disabled : this.disabled,
			file_post_name: this.filePostName,
            use_query_string : this.useQueryString,
            preserve_relative_urls : this.preserveRelativeUrls,
            requeue_on_error : this.requeueOnError,
            http_success : this.httpSuccess,
            assume_success_timeout : this.assumeSuccessTimeout,
            prevent_swf_caching : this.preventSwfCaching,
            debug: this.debug,
			button_placeholder: this.el.down("div.x-swfplaceholder").dom,

			file_queued_handler: Ext.Function.bind(this.swfUploadfileQueued, this),
			file_dialog_complete_handler: Ext.Function.bind(this.swfUploadFileDialogComplete, this),
			upload_start_handler: Ext.Function.bind(this.swfUploadUploadStarted, this),
			upload_error_handler: Ext.Function.bind(this.swfUploadUploadError, this),
			upload_progress_handler: Ext.Function.bind(this.swfUploadUploadProgress, this),
			upload_success_handler: Ext.Function.bind(this.swfUploadSuccess, this),
			upload_complete_handler: Ext.Function.bind(this.swfUploadComplete, this),
			file_queue_error_handler: Ext.Function.bind(this.swfUploadFileQueError, this),
			swfupload_load_failed_handler: Ext.Function.bind(this.swfUploadLoadFailed, this),
            swfupload_loaded_handler : Ext.Function.bind(this.flashReady, this),
            swfupload_preload_handler : Ext.Function.bind(this.swfUploadPreload, this),
            file_dialog_start_handler: Ext.Function.bind(this.fileDialogStartHandler, this),
            upload_resize_start_handler: Ext.Function.bind(this.uploadResizeStart, this),
            mouse_click_handler: Ext.Function.bind(this.mouseClickHandler, this),
            mouse_out_handler: Ext.Function.bind(this.mouseOutHandler, this),
            mouse_over_handler: Ext.Function.bind(this.mouseOverHandler, this),
            debug_handler: Ext.Function.bind(this.debugHandler, this),
            queue_complete_handler : Ext.Function.bind(this.queueCompleteHandler, this)
		};

        if (this.flashButton) {
            Ext.apply(settings, this.flashButton);
        }

		this.multiUpload = new SWFUpload(settings);
        
        this.createUploadButton();
        this.flashReady();
	},

    swfUploadLoadFailed : function () {
        return this.fireEvent("swfuploadloadfailed", this);
    },

    swfUploadPreload : function () {
        return this.fireEvent("swfuploadpreload", this);
    },

    fileDialogStartHandler : function () {
        return this.fireEvent("filedialogstart", this);
    },

    uploadResizeStart : function (file, width, height, encoding, quality) {
        return this.fireEvent("uploadresizestart", this, this.swfUploadQueue[file.id], width, height, encoding, quality);
    },

    mouseClickHandler : function () {
        return this.fireEvent("mouseclick", this);
    },

    mouseOutHandler : function () {
        return this.fireEvent("mouseout", this);
    },

    mouseOverHandler : function () {
        return this.fireEvent("mouseover", this);
    },

    debugHandler : function (message) {
        return this.fireEvent("debug", this, message);
    },

    queueCompleteHandler : function (count) {
        var status,
            fileId;

        for(fileId in this.fileQueue){
			status = this.fileQueue[fileId].status;
            if (status == "started" || status == "queued") {
				return;
			}
		}
        
        return this.fireEvent("queuecomplete", this, count);
    },

    flashReady : function () {
        if (!this.multiUpload.movieElement.getAttribute) {
            this.multiUpload.movieElement.getAttribute = Ext.emptyFn;
        }
        Ext.get(this.multiUpload.movieElement).applyStyles("position:absolute;top:0px;left:0px;z-index:100;")
            .setOpacity(0, false);

        this.syncFlashSize();
        return this.fireEvent("swfuploadloaded", this);
    },

    createUploadButton : function () {
        if (!this.flashButton) {
            var cfg = this.button || {text : "Browse..."};

            cfg.renderTo = this.el.first("div");
            cfg.disabled = this.disabled;
            cfg.style = "position:absolute;top:0px;left:0px;z-index:50;";
            this.button = Ext.ComponentManager.create(cfg, "button");
            this.bindButtonListeners();
            this.button.on("resize", this.syncFlashSize, this);
        }
    },

    bindButtonListeners: function(){
        Ext.get(this.multiUpload.movieElement).on({
            scope: this,
            mouseenter: function() {
                this.button.addClsWithUI(this.button.overCls);
            },
            mouseleave: function(){
                this.button.removeClsWithUI(this.button.overCls);
            },
            mousedown: function(){
                this.button.addClsWithUI(this.button.pressedCls);
            },
            mouseup: function(){
                this.button.removeClsWithUI(this.button.pressedCls);
            }
        }); 
    },

    syncFlashSize : function () {
        if (this.button) {
            var size = this.button.getSize();
            Ext.get(this.multiUpload.movieElement).setSize(size);
            this.el.first("div").setHeight(size.height);
            this.setSize(size);
        }
    },

    initDragDropElement : function (el) {
        el.on({
			dragenter : function(e){
				e.browserEvent.dataTransfer.dropEffect = "move";
				return true;
			},

			dragover : function(e){
				e.browserEvent.dataTransfer.dropEffect = "move";
				e.stopEvent();
				return true;
			},

			drop : function(e){				
				var files = e.browserEvent.dataTransfer.files,
                    len;

                e.stopEvent();

				if (!files) {
					return true;
				}

				len = files.length;

				while(--len >= 0){
					this.processDragAndDropFileUpload(files[len]);
				}
			},

            scope:this
		});
    },

	initDragAndDropUploader : function () {
        if (this.dragDropElement) {
            this.initDragDropElement(Ext.net.getEl(this.dragDropElement));
        }
        else {
            this.initDragDropElement(Ext.get(this.multiUpload.movieElement));
        }
		
		if (this.fileDropAnywhere) {
			this.initDragDropElement(Ext.getBody());
		} else {
			if(!Ext.net.MultiUpload.preventBodyDrag){
				Ext.net.MultiUpload.preventBodyDrag = true;
				
				Ext.getBody().on({
					dragenter : function () {
						return true;
					},

					dragleave : function () {
						return true;
					},
					
                    dragover : function (e) {
						event.stopEvent();
						return true;
					},

					drop : function (e) {
						e.stopEvent();
						return true;
					}
				});
			}
		}
		
	},

	dragAndDropUploadStart : function (fileInfo) {
		var upload = new Ext.net.XHRUpload ({
			url : this.xhrUpload.uploadUrl || this.uploadUrl,
			filePostName : this.xhrUpload.filePostName,
			fileNameHeader : this.xhrUpload.fileNameHeader,
			postParams : this.postParams,
			swf : this,
			file : fileInfo.file,
			listeners : {				
				uploadloadstart : function(e) {
					this.fireEvent("uploadstart", this, fileInfo, e);
				},
				uploadprogress : function (e) {
					this.fireEvent('uploadprogress', this, fileInfo, e.loaded, e.total, e);
				},				
				loadstart : function (e) {
					fileInfo.status = "started";
					this.fireEvent("start", this, fileInfo, e);
				},
				progress : function (e) {
					this.fireEvent("progress", this, fileInfo, e.loaded, e.total, e);
				},
				abort : function (e) {
					fileInfo.status = "aborted";
					this.fireEvent("abort", this, fileInfo, "XHR upload aborted", e);
                    this.fireEvent("uploadcomplete", this, fileInfo);
				},
				error : function (e) {
					fileInfo.status = "error";
					this.fireEvent("error", this, fileInfo, "XHR upload error", e);
                    this.fireEvent("uploadcomplete", this, fileInfo);
				},
				load : function (e) {
					this.processUploadResult(fileInfo, upload.xhr.responseText,  true);
                    this.fireEvent("uploadcomplete", this, fileInfo);
				},
                scope:this
			}
		});

		fileInfo.upload = upload;
		upload.send();
	},
	
    processDragAndDropFileUpload : function (file) {
		var fileInfo = {
			id: ++this.fileId,
			name: file.name,
			size: file.size,
			status: "queued",
			method: "dnd",
			file: file
		},
        limit = this.getSizeLimit();
		
		if (limit && fileInfo.size > limit) {
			this.fireEvent("fileselectionerror", this, fileInfo, SWFUpload.UPLOAD_ERROR.UPLOAD_LIMIT_EXCEEDED, this.fileSizeEventText);
			return true;
		}

		if (this.fireEvent("fileselected", this, fileInfo) !== false) {
			this.fileQueue[fileInfo.id] = fileInfo;
            this.fireEvent("filequeued", this, fileInfo);
			if (this.autoStartUpload) {
				this.dragAndDropUploadStart(fileInfo);
			}
		}
	},

	swfUploadfileQueued : function (file) {
		var fileInfo = {
			id: ++this.fileId,
			name: file.name,
			size: file.size,
			status: "queued",
			method: "swfupload",
			swfuploadFile: file
		};

		if (this.fireEvent("fileselected", this, fileInfo) !== false) {
			this.fileQueue[fileInfo.id] = fileInfo;
			this.swfUploadQueue[file.id] = fileInfo;
            this.fireEvent("filequeued", this, fileInfo);
		} else {
			this.multiUpload.cancelUpload(file.id, false);	
		}
		return true;
	},

	swfUploadFileQueError : function (file, error, message) {
		var fileInfo = {
			id: ++this.fileId,
			name: file ? file.name : "",
			size: file ? file.size : -1,
			status: "error",
			method: "swfupload"
		};

		this.fireEvent("fileselectionerror", this, fileInfo, error, message);
	},

	swfUploadUploadStart : function () {
		this.multiUpload.startUpload();
	},
	
    swfUploadFileDialogComplete : function (selectedFilesNum, queuedFilesNum, filesInQueue) {		
        this.fireEvent("filedialogcomplete", this, selectedFilesNum, queuedFilesNum, filesInQueue);
        if(this.autoStartUpload){
			this.swfUploadUploadStart();
		}
	},

	swfUploadUploadProgress : function (file, bytesComplete, bytesTotal) {
		return this.fireEvent("uploadprogress", this, this.swfUploadQueue[file.id], bytesComplete, bytesTotal);	
	},

    buildForm : function (cmp) {
        var formCfg = {};

        formCfg.action = Ext.ClassManager.instantiateByAlias('formaction.standardsubmit', { form: cmp.getForm() });
        formCfg.action.submitEmptyText = false;
        formCfg.form = formCfg.action.buildForm().formEl;
        formCfg.form._removeAfterParams = true;

        return Ext.get(formCfg.form);
    },

    getForm : function () {
        var form,
            formPanel,
            cmp;

        if (Ext.isFunction(this.formId)) {
            form = this.formId.call(this);
        }
        else {
            form = Ext.get(this.formId);
        } 

        if (form && form.id) {
            cmp = Ext.getCmp(form.id);

            if (cmp && cmp.getForm && cmp.submit) {
                form = this.buildForm(cmp);
            }
        }

        if (!form) {
            form = this.el.up("form");
                                
            if (!form) {
                formPanel = this.up("form");

                if (formPanel && formPanel.getForm && formPanel.submit) {
                    form = this.buildForm(formPanel);
                }
            }
        } 

        if (!form && Ext.net.ResourceMgr.aspForm) {
            form = Ext.get(Ext.net.ResourceMgr.aspForm);
        }

        return form ? Ext.get(form).dom : null;
    },

    getFormParams : function () {
        var params = {},
            form;

        if (this.requestType != "load") {
            form = this.getForm();

            if (form) {
                var fElements = form.elements || (document.forms[form] || Ext.getDom(form)).elements,
	                hasSubmit = true,
	                hasValue,		            
		            element,
		            name,
		            type,
                    i,
		            submitDisabled = Ext.net && Ext.net.ResourceMgr && Ext.net.ResourceMgr.submitDisabled;

	            for (i = 0; i < fElements.length; i++) {
		            element = fElements[i];
		            name = element.name;
		            type = element.type;

		            if ((!element.disabled || submitDisabled) && name) {
			            if (/select-(one|multiple)/i.test(type)) {
				            Ext.each(element.options, function (opt) {
					            if (opt.selected) {
						            hasValue = opt.hasAttribute ? opt.hasAttribute('value') : opt.getAttributeNode('value').specified; 
                                    params[name] = hasValue ? opt.value : opt.text;
					            }
				            });
			            } else if (!/file|undefined|reset|button/i.test(type)) {
				            if (!(/radio|checkbox/i.test(type) && !element.checked) && !(type == "submit" && hasSubmit)) {					            
                                params[name] = element.value;
  
					            if (type == "submit") {
					                hasSubmit = /submit/i.test(type);
                                }
                            }
                        }
                    }
                }

                if (form._removeAfterParams) {
                    Ext.removeNode(form);
                }
            }
        }
        
        return params;
    },

	swfUploadUploadStarted : function(file) {
		this.swfUploadQueue[file.id].status = "started";

        var obj = this.getFormParams();

        if (this.buildPostParams) {            
            obj = Ext.apply(obj, this.buildPostParams(file));            
        }

        if (!Ext.isEmptyObj(obj)) {
            this.multiUpload.setPostParams(obj);
        }

        if (this.hasId()) {
            this.multiUpload.addPostParam("X-NET-SwfUpload", this.id);
        }
        
		return this.fireEvent("uploadstart", this, this.swfUploadQueue[file.id]);
	},

	swfUploadComplete : function (file) {
		if (!this.swfUploadStopped ) {
			this.multiUpload.startUpload();
		}

        return this.fireEvent("uploadcomplete", this, this.swfUploadQueue[file.id]);
	},

	swfUploadUploadError : function (file, errorCode, message) {
        if(errorCode == -290){
			return true;
		}
		
		if (file) {
            this.swfUploadQueue[file.id].status = "error";
        }
		return this.fireEvent("uploaderror", this, file ? this.swfUploadQueue[file.id] : null, errorCode, message);
	},

	swfUploadSuccess : function (file, serverData, response) {
		this.processUploadResult(this.swfUploadQueue[file.id], serverData, response);
	},

    processUploadResult : function (fileInfo, serverData, response) {
		Ext.net.DirectEvent.requestSuccessHandler({responseText : serverData}, {scope: Ext.net.DirectEvent});

        if (this.fireEvent("uploadsuccess", this, fileInfo, serverData, response) !== false) {
			fileInfo.status = "completed";
		} 
        else {
			fileInfo.status = "error";
			this.fireEvent("uploaderror", this, fileInfo, -1, "Canceled");
		}		

        if (fileInfo && fileInfo.method == "dnd") {
            this.queueCompleteHandler();
        }
	}
});

Ext.define("Ext.net.XHRUpload", {
    extend: "Ext.util.Observable",

    method: "POST",
	fileNameHeader: "X-File-Name",	
	contentTypeHeader: "text/plain; charset=x-user-defined-binary",	
	xhrExtraPostDataPrefix: "extraPostData_",

    constructor : function (config) {
	    this.callParent(arguments);

        this.postParams = this.postParams || {};
        this.xhrEvents = ["loadstart", "progress", "progressabort", "error", "load", "loadend"];
        
        for (var i = 0; i < this.xhrEvents.length; i++ ) {
            this.addEvents(this.xhrEvents[i], "upload" + this.xhrEvents[i]);
		}
    },

	send : function(config) {
		var i,
            attr,
            formData;

        Ext.apply(this, config);

		this.xhr = new XMLHttpRequest();

        for ( i = 0; i < this.xhrEvents.length; i++ ) {
            this.xhr.addEventListener(this.xhrEvents[i], Ext.Function.bind(this.relayXHREvent, this), false);
		}

        for ( i = 0; i < this.xhrEvents.length; i++ ) {
            this.xhr.upload.addEventListener(this.xhrEvents[i], Ext.Function.bind(this.relayUploadEvent, this), false);
		}
		
		this.xhr.open(this.method, this.url, true);
        
		this.xhr.setRequestHeader(this.fileNameHeader, this.encodeFileName(this.file.name));
        
        if (this.swf.hasId()) {
            this.xhr.setRequestHeader("X-NET-SwfUpload", this.swf.id);
        }
        
		for(attr in this.postParams){
			this.xhr.setRequestHeader(this.xhrExtraPostDataPrefix + attr, this.postParams[attr]);
		}
		
        formData = new FormData();
        formData.append(this.swf.filePostName, this.file);
        this.xhr.send(formData);
		return true;		
	},
	
	encodeFileName: function (name) {
	    var v = name,
            fileNameRegex = /[^\\]*$/im,
            fileNameRegexNix = /[^/]*$/im,
            match = fileNameRegex.exec(v);

	    if (match !== null) {
	        name = match[0];
	    }
	    else {
	        match = fileNameRegexNix.exec(v);
	        if (match !== null) {
	            name = match[0];
	        }
	    }

	    return unescape(encodeURIComponent(name));
	},

	relayUploadEvent : function (e) {
		this.fireEvent("upload" + e.type, e);
	},
	
    relayXHREvent : function(e) {
		this.fireEvent(e.type, e);
	}
});
Ext.define("Ext.net.VerticalMarker", {
    extend : 'Ext.util.Observable',
    alias  : "plugin.verticalmarker",

    xLabelCls  : "x-vmarker-xfieldlabel",
    yLabelCls  : "x-vmarker-yfieldlabel",
    snap       : false,
    showXLabel : true,
    buffer     : 0,

    constructor: function (config) {
        Ext.apply(this, config);
        this.addEvents("labelsready");
        this.callParent(arguments);
    },

    init: function (chart) {
        var me = this;

        me.chart = chart;

        if (chart.rendered) {
            me.initialize();
        } else {
            me.chart.on("afterrender", me.initialize, me, { single: true, delay: 500 });
        }
    },

    initialize: function () {
        var me = this;

        if (me.disabled) {
            return;
        }

        me.chart.on({
            mousemove  : me.onMouseMove,
            mouseleave : me.onMouseLeave,
            scope      : me
        });

        me.markerSprite = me.chart.surface.add(Ext.apply({
            type    : 'path',
            path    : ['M', 0, 0],
            zIndex  : 1001,
            opacity : 0.6,
            hidden  : true,
            stroke  : '#00f',
            cursor  : 'crosshair'
        }, me.markerConfig || {}));

        me.chart.redraw = Ext.Function.createSequence(me.chart.redraw, function () {
            me.hideVisibleStuff();
        }, me);
    },

    initLabels: function () {
        if (this.labels) {
            return;
        }

        var me = this,
            seriesItems = me.chart.series.items,
            series,
            i,
            len;

        me.xFieldLabel = new Ext.Component({
            floating: true,
            cls: this.xLabelCls
        });

        me.labels = [];

        for (i = 0, ln = seriesItems.length; i < ln; i++) {
            series = seriesItems[i];
            me.labels.push(
                new Ext.Component({
                    floating : true,
                    style    : "background-color: " + series.getLegendColor() + ";",
                    renderTo : document.body,
                    hidden   : true,
                    cls      : this.yLabelCls
                })
            );
        }

        if (me.buffer > 0) {
            me.eArg = [{
                getXY: Ext.Function.bind(me.eGetXY, me),
                getPageX: Ext.Function.bind(me.eGetPageX, me)
            }];
        }

        this.fireEvent("labelsready", this);
    },

    onMouseMove: function (e) {
        var me = this,
            position = me.chart.getEventXY(e),
            bbox = me.chart.bbox || me.chart.chartBBox,
            seriesItems = me.chart.series.items,
            label,
            x = bbox.x,
            y = bbox.y,
            height = Math.floor(y + bbox.height),
            width = Math.floor(x + bbox.width),
            staticX = e.getPageX() - me.chart.el.getX(),
            staticY = y,
            series,
            item,
            items,
            nearestItem,
            nearestX,
            minDist,
            i, ln,
            xy,
            lastItemFound = false,
            surfaceExt = Ext.get(me.chart.surface.getId()),
            surfacePosition = surfaceExt.getXY(),
            sprite,
            path;

        staticX = Math.min(Math.max(staticX, x), width);

        me.initLabels();

        if (me.buffer <= 0 || ((new Date().getTime() - (me.lastTime || 0)) > me.buffer)) {
            me.lastTime = new Date().getTime();

            if (me.updateTask) {
                me.updateTask.cancel();
            }

            items = [];
            minDist = 10000;
            for (i = 0, ln = seriesItems.length; i < ln; i++) {
                series = seriesItems[i];
                label = me.labels[i];
                item = me.getItemForX(series, position[0]);
                items.push(item);

                if (item && item.dist < minDist) {
                    nearestItem = item;
                    minDist = item.dist;
                    nearestX = item.item.storeItem.get(series.xField);
                }
            }

            for (i = 0, ln = seriesItems.length; i < ln; i++) {
                item = items[i];                
                if (item && item.item.storeItem.get(seriesItems[i].xField) !== nearestX) {
                    items[i] = null;
                }
            }

            for (i = 0, ln = seriesItems.length; i < ln; i++) {
                series = seriesItems[i];
                label = me.labels[i];

                item = items[i];

                if (item) {
                    if (!me.lastItem || me.lastItem.item.storeItem.id != item.item.storeItem.id) {
                        me.labelXAdj = 0;
                        lastItemFound = true;
                        me.lastItem = item;
                        me.lastField = series.xField;
                    }
                    else if (!lastItemFound) {
                        continue;
                    }

                    sprite = item.item.sprite;

                    if (sprite && sprite.attr) {
                        x = surfacePosition[0] + (sprite.attr.x || 0) + (sprite.attr.translation && sprite.attr.translation.x || 0);
                        y = surfacePosition[1] + (sprite.attr.y || 0) + (sprite.attr.translation && sprite.attr.translation.y || 0);
                    }
                    else {
                        x = surfacePosition[0] + parseInt(item.item.point[0], 10);
                        y = surfacePosition[1] + parseInt(item.item.point[1], 10);
                    }

                    if (me.snap) {
                        staticX = x - me.chart.el.getX();
                    }

                    label.show();

                    if (me.yLabelRenderer) {
                        me.updateLabel(label, me.yLabelRenderer.call(me.yLabelScope || me, me, label, item.item.storeItem.get(series.yField), item.item.storeItem, series.yField, series));
                    }
                    else {
                        me.updateLabel(me.labels[i], item.item.storeItem.get(series.yField));
                    }

                    label.el.setXY(me.checkY(i, x + 5, y), false);
                }
                else {
                    label.hide();
                }
            }
        }
        else if (me.buffer > 0) {
            if (!me.updateTask) {
                me.updateTask = new Ext.util.DelayedTask(function (e) {
                    this.onMouseMove(e);
                }, me);
            }

            me._eXY = e.getXY();
            me._ePageX = e.getPageX();
            me.updateTask.delay(me.buffer, undefined, undefined, me.eArg);
        }

        path = ['M', staticX, staticY, 'L', staticX, height];

        if (!me.snap || lastItemFound) {
            me.markerSprite.setAttributes({
                path: path,
                'stroke-width': 1,
                hidden: false
            }, true);
        }

        if (lastItemFound && me.showXLabel) {
            me.xFieldLabel.show();

            if (me.xLabelRenderer) {
                me.updateLabel(me.xFieldLabel, me.xLabelRenderer.call(me.xLabelScope || me, me, me.xFieldLabel, me.lastItem.item.storeItem.get(me.lastField), me.lastItem.item.storeItem, me.lastField));
            }
            else {
                me.updateLabel(me.xFieldLabel, me.lastItem.item.storeItem.get(me.lastField));
            }
        }

        if ((!me.snap || lastItemFound) && me.showXLabel) {
            x = surfacePosition[0] + staticX;
            y = surfacePosition[1] + height;
            me.xFieldLabel.el.moveTo(x - me.xFieldLabel.getWidth() / 2, y, false);
        }
    },

    updateLabel: function (el, value) {
        if (!Ext.isString(value) && !Ext.isEmpty(value)) {
            value = value.toString();
        }

        el.update(value);
    },

    eGetXY: function () {
        return this._eXY;
    },

    eGetPageX: function () {
        return this._ePageX;
    },

    checkY: function (ind, x, y) {
        var me = this,
            i,
            box,
            height = me.labels[ind].getHeight(),
            t,
            b;

        y = y - height / 2;

        for (i = 0; i < ind; i++) {
            if (me.labels[i].rendered) {
                box = me.labels[i].getBox();
                t = Math.max(y, box.y);
                b = Math.min(y + height, box.y + box.height);

                if (b > t) {
                    me.labelXAdj = me.labelXAdj + box.width + 2;
                    y = box.y;
                    x = x + me.labelXAdj;
                    break;
                }
            }
        }

        return [x, y];
    },

    withinBoxX: function (x, box) {
        box = box || {};
        return x >= box.x && x <= (box.x + box.width);
    },

    getItemForX: function (series, x) {
        if (!series.items || !series.items.length || series.seriesIsHidden) {
            return null;
        }        

        var me = this,
            items = series.items,
            bbox = series.bbox,
            foundItem = items[0],
            foundDist = 10000,
            item, dist,
            lastItem = items[items.length - 1],
            i, ln;       

        for (i = 0, ln = items.length; i < ln; i++) {
            item = items[i];

            if (item) {
                dist = Math.abs(item.point[0] - x);
                if (dist > foundDist) {
                    return {
                        item   : foundItem,
                        i      : i,
                        dist   : foundDist,
                        length : items.length
                    };
                }
                foundDist = dist;
                foundItem = item;
            }
        }

        return {
            item   : foundItem,
            dist   : foundDist,
            i      : items.length - 1,
            length : items.length
        };
    },

    onMouseLeave: function (e) {
        this.hideVisibleStuff();
    },

    hideVisibleStuff: function () {
        var me = this;

        if (me.updateTask) {
            me.updateTask.cancel();
        }
 
        if (me.markerSprite) {
            me.markerSprite.hide(true);
        }
 
        if (me.xFieldLabel) {
            me.xFieldLabel.hide();
        }
 
        delete me.lastItem;
 
        if (me.labels) {
            for (var i = 0, ln = me.labels.length; i < ln; i++) {
                me.labels[i].rendered && me.labels[i].hide();
            }
        }
    },

    disable: function () {
        var me = this;

        if (me.disabled === true) {
            return;
        }

        if (me.updateTask) {
            me.updateTask.cancel();
        }

        me.chart.un({
            mousemove: me.onMouseMove,
            mouseleave: me.onMouseLeave,
            scope: me
        });

        me.hideVisibleStuff();
        me.disabled = true;
    },

    enable: function () {
        var me = this;

        if (me.disabled === true) {
            me.disabled = false;
            me.initialize();
        }
    },

    destroy: function () {
        var me = this,
            i,
            ln;

        if (me.xFieldLabel) {
            me.xFieldLabel.destroy();
        }

        if (me.labels) {
            for (i = 0, ln = me.labels.length; i < ln; i++) {
                me.labels[i].destroy();
            }
        }

        this.callParent(arguments);
    }
});
Ext.define( "Ext.net.ComponentView", {
    extend: "Ext.util.Observable",
    alias: "plugin.componentview",

    constructor: function ( config ) {
        var me = this;
        
        Ext.apply( me, config );
        this.addEvents( "bind", "beforebind", "componentbind", "beforecomponentbind", "componentunbind" );
        me.cache = [];
        me.items = me.items || [];
        me.callParent( arguments );
    },

    init: function ( view ) {
        var me = this;
        me.view = view;

        me.view.on( "beforerefresh", me.removeComponents, me );
        me.view.on( "refresh", me.insertComponents, me );
        me.view.on( "beforeitemupdate", me.removeComponent, me );
        me.view.on( "beforeitemremove", me.removeComponent, me );
        me.view.on( "itemadd", me.itemAdded, me );
        me.view.on( "itemupdate", me.itemUpdated, me );

        me.view.tpl.apply = function ( values ) {
            return Ext.XTemplate.prototype.apply.apply( this, [me.addValues( values )] );
        };
    },

    getComponentTpl: function ( tpl ) {
        var me = this;
        return Ext.isFunction( tpl.component ) ? tpl.component.call( me ) : tpl.component;
    },

    getComponentTarget: function ( tpl, node ) {
        var me = this,
            selector = tpl.selector;

        if ( tpl.value ) {
            selector = me.getValueSelector( tpl.value );
        }

        return node.query( selector );
    },

    getComponentsValues: function () {
        var me = this,
            cls;

        if ( me.componentValues ) {
            return me.componentValues;
        }

        me.componentValues = [];
        Ext.each( me.items, function ( tpl ) {
            if ( tpl.value ) {
                cls = Ext.id();
                me.componentValues.push( [tpl.value, '<div class="x-hidden ' + cls + '"></div>', "." + cls] );
            }
        } );

        return me.componentValues;
    },

    getValueSelector: function ( value ) {
        var me = this;

        if ( !me.valuesSelector ) {
            me.valuesSelector = {};
            Ext.each( me.getComponentsValues(), function ( tpl ) {
                me.valuesSelector[tpl[0]] = tpl[2];
            } );
        }

        return me.valuesSelector[value];
    },

    addValues: function ( values ) {
        var me = this,
            cmpValues = me.getComponentsValues(),
            id,
            copy = {};

        if ( cmpValues.length == 0 ) {
            return values;
        }

        if ( Ext.isArray( values ) ) {
            return Ext.Array.map( values, function ( value ) {
                return me.addValues( value );
            } );
        }

        if ( !Ext.isObject( values ) ) {
            return values;
        }

        Ext.Object.each( values, function ( key, value ) {
            copy[key] = me.addValues( value );
        } );

        Ext.each( cmpValues, function ( value ) {
            copy[value[0]] = value[1];
        } );

        return copy;
    },

    insertComponent: function ( first, last ) {
        this.insertComponents( first, last + 1 );
    },

    itemUpdated: function ( record, index ) {
        this.insertComponents( index, index + 1 );
    },

    itemAdded: function ( records, index ) {
        this.insertComponents( index, index + ( records.length || 1 ) );
    },

    insertComponents: function ( start, end ) {
        var me = this,
            nodes = me.view.all.elements,
            node,
            i,
            c,
            t,
            cmp,
            cmps,
            targets,
            trg,
            tpl,
            len,
            record;

        if ( Ext.isEmpty( start ) || Ext.isEmpty( end ) || !Ext.isNumber( start ) || !Ext.isNumber( end ) ) {
            start = 0;
            end = nodes.length;
        }

        for ( i = start; i < end; i++ ) {
            node = Ext.get( nodes[i] );
            record = me.view.store.getAt( i );

            if ( me.fireEvent( "beforebind", me, record, node, i, me.view ) !== false ) {
                cmps = [];
                for ( c = 0, len = me.items.length; c < len; c++ ) {
                    cmp = me.items[c];
                    targets = me.getComponentTarget( cmp, node );

                    for ( t = 0; t < targets.length; t++ ) {
                        tpl = me.getComponentTpl( cmp );
                        trg = Ext.get( targets[t] );
                        if ( me.fireEvent( "beforecomponentbind", me, cmp, tpl, record, node, trg, i, me.view ) !== false ) {
                            tpl = Ext.ComponentManager.create( tpl );
                            cmps.push( tpl );
                            tpl.record = record;
                            me.cache.push( { id: record.id, cmp: tpl } );
                            if ( cmp.value ) {
                                tpl.render( trg.parent(), trg );
                                trg.remove();
                            }
                            else {
                                tpl.render( trg );
                            }

                            tpl.parentView = {
                                view: me.view,
                                record: record
                            };

                            if ( me.fireEvent( "componentbind", me, cmp, tpl, record, node, i, me.view ) === false ) {
                                delete tpl.parentView;
                                tpl.destroy();
                            }
                            else {
                                me.onBind( cmp, tpl, record );
                            }
                        }
                        else if ( cmp.value ) {
                            trg.remove();
                        }
                    }
                }

                me.fireEvent( "bind", me, record, cmps, node, i, me.view ) !== false
            }
            else {
                for ( c = 0, len = me.items.length; c < len; c++ ) {
                    cmp = me.items[c];
                    targets = me.getComponentTarget( cmp, node );
                    for ( t = 0; t < targets.length; t++ ) {
                        if ( cmp.value ) {
                            Ext.removeNode( targets[t] );
                        }
                    }
                }
            }
        }

        if ( !me.view.bufferedRefreshSize ) {
            me.view.bufferedRefreshSize = Ext.Function.createBuffered( me.view.refreshSize, 10, me.view );
        }

        me.view.bufferedRefreshSize();
    },

    onBind: function ( cmp, tpl, record ) {
        if ( cmp.boundField && Ext.isFunction( tpl.setValue ) ) {
            this.settingValue = true;
            tpl.setValue( record.get( cmp.boundField ) );
            this.settingValue = false;
            tpl.parentView.boundField = cmp.boundField;
            tpl.on( "change", this.onSaveEvent, this );
        }
    },

    onSaveEvent: function ( field ) {
        var me = this,
            value = field.getValue();

        if ( me.settingValue || ( field.record.get( field.parentView.boundField ) == value ) || !field.isValid() ) {
            return;
        }

        field.record.beginEdit();
        field.record.set( field.parentView.boundField, value );
        field.record.endEdit( true );
    },

    removeComponent: function ( view, record, rowIndex ) {
        for ( var i = 0, l = this.cache.length; i < l; i++ ) {
            if ( this.cache[i].id == record.id ) {
                try {
                    var cmp = this.cache[i].cmp;
                    this.fireEvent( "componentunbind", this, cmp, cmp.record, this.view );
                    this.onUnbind( cmp );

                    cmp.destroy();
                    Ext.Array.remove( this.cache, this.cache[i] );
                } catch ( ex ) { }

                break;
            }
        }
    },

    removeComponents: function () {
        for ( var i = 0, l = this.cache.length; i < l; i++ ) {
            try {
                var cmp = this.cache[i].cmp;
                this.fireEvent( "componentunbind", this, cmp, cmp.record, this.view );
                this.onUnbind( cmp );
                cmp.destroy();
            } catch ( ex ) { }
        }

        this.cache = [];
    },

    onUnbind: function ( cmp ) {
        delete cmp.parentView;
        delete cmp.record;
    },

    destroy: function () {
        var view = this.view;

        this.removeComponents();
        view.un( "refresh", this.insertComponents, this );
        view.un( "beforerefresh", this.removeComponents, this );
        view.un( "beforeitemupdate", this.removeComponent, this );
        view.un( "beforeitemremove", this.removeComponent, this );
        view.un( "itemadd", this.itemAdded, this );
        view.un( "itemupdate", this.itemUpdated, this );
    }
});
Ext.define("Ext.net.GroupPaging", {
    alias  : "plugin.grouppaging",

    constructor : function(config) {
        if (config) {
            Ext.apply(this, config);
        }
    },
    
    init : function (toolbar) {
        this.toolbar = toolbar;
        this.store = toolbar.store;

        if (this.store.applyPaging) {
            this.store.applyPaging = Ext.Function.bind(this.applyPaging, this);
        }
        this.store.getTotalCount = this.getTotalCount;
        this.store.pageSize = 1;

        if (this.store.proxy instanceof Ext.data.proxy.Memory) {
            this.store.proxy.enablePaging = false;            
        }
    },

    getGroups : function (records) {
        var length = records.length,
            groups = [],
            pointers = {},
            record,
            groupStr,
            group,
            children,
            first = this.store.groupers.first(),
            groupField = first.property,
            i;

        for (i = 0; i < length; i++) {
            record = records[i];
            groupStr = record.get(groupField);
            group = pointers[groupStr];

            if (group === undefined) {
                group = {
                    name: groupStr,
                    children: []
                };

                groups.push(group);
                pointers[groupStr] = group;
            }

            group.children.push(record);
        }

        return groups;
    },

    applyPaging : function () {             
        var allData = this.store.data, 
            groups = this.getGroups(allData.items),
            data = new Ext.util.MixedCollection({
                getKey: Ext.data.Store.recordIdFn,
                maintainIndices: true
            });

        data.pageSize = this.store.pageSize;
            
        data.addAll(groups[this.store.currentPage - 1].children);
        this.store.totalCount = groups.length;
        this.store.allData = allData;
        this.store.data = data;
    },

    getTotalCount : function () {
        return this.totalCount;
    }
});
Ext.define('Ext.net.TagLabel', {
    extend: 'Ext.Component',
    alias: 'widget.taglabel',
    maxLength: 18,
    closeCls: 'x-taglabel-item-close',
    baseCls: "x-taglabel",
    defaultClosable: false,
    allowDuplicates: true,
    selectionMode: false,
    stacked: false,
    trackOver: false,
    removeOnDblClick: false,
    menuAlign: "tl-bl?",
    menuOnLeftClick: false,
    valueDelimeter: "::",
    tagsDelimeter: ",",
    //tagsMax : 0
    //destroyMenu: true

    renderTpl: [
        '<ul class="x-taglabel-list">',
            '{[this.empty(values)]}',
            '{[this.tagInput()]}',
        '</ul>',
        {
            compiled: true,
            disableFormats: true,
            label: this,
            tagInput: function () {
                return this.label.inputEl ? '<li class="x-taglabel-input"></li>' : '';
            },

            empty: function (values) {
                return this.label.emptyText ? ('<span class="x-taglabel-empty">' + (values.length ? '' : this.label.emptyText) + '</span>') : '';
            }
        }
    ],

    initComponent: function () {
        this.addEvents(
            "beforetagadd",
            "tagadd",
            "beforetagremove",
            "tagremove",
            "click",
            "dblclick",
            "contextmenu",
            "beforeselect",
            "select"
         );

        this.ignoreChange = 0;
        if (Ext.isArray(this.renderTpl)) {
            this.renderTpl[this.renderTpl.length - 1].label = this;
        }
        else {
            this.renderTpl.label = this;
        }

        this.callParent(arguments);

        this.tags = this.tags || [];

        if (Ext.isString(this.tags)) {
            this.tags = Ext.Array.clean(this.tags.split(this.tagsDelimeter));
        }

        if (this.stacked) {
            this.addCls("x-taglabel-stacked");
        }

        if (this.menu) {
            this.menu = Ext.menu.Manager.get(this.menu);
            this.menu.tagLabel = this;
        }
    },

    beforeRender: function () {
        var me = this;

        me.callParent(arguments);

        Ext.apply(me.renderData, {
            label: me
        });

        Ext.apply(me.renderSelectors, {
            emptyEl: "span.x-taglabel-empty",
            ulEl: "ul",
            inputLi: "li.x-taglabel-input"
        });
    },

    afterRender: function () {
        var me = this;

        me.callParent(arguments);

        if (me.menu && me.menuOnLeftClick) {
            me.mon(me.menu, {
                scope: me,
                show: me.onMenuShow,
                hide: me.onMenuHide
            });
        }

        me.mon(me.ulEl, {
            scope: me,
            click: me.handleEvent,
            dblclick: me.handleEvent,
            contextmenu: me.handleEvent,
            keydown: me.handleEvent
        });

        me.ulEl.unselectable();

        if (this.inputLi && this.inputEl) {
            this.inputLi.appendChild(this.inputEl);
            this.mon(this.inputEl, "focus", this.onInputElFocus, this);
            this.mon(this.inputEl, "blur", this.onInputElBlur, this);
            this.mon(this.inputEl, Ext.EventManager.getKeyEvent(), this.fireKey, this);
        }

        if (me.tags.length) {
            var tags = me.tags;
            me.tags = [];
            me.add(tags);
        }
    },

    fireKey: function (e) {
        if (e.isSpecialKey()) {
            this.checkTab(this, new Ext.EventObjectImpl(e));
        }
    },

    checkTab: Ext.emptyFn,

    updateIndexes: function () {
        for (var i = 0; i < this.tags.length; i++) {
            this.tags[i].el.set({
                "data-index": i
            });
        }
    },

    getByField: function (name, value) {
        var i;
        for (i = 0; i < this.tags.length; i++) {
            if (this.tags[i][name] == value) {
                return this.tags[i];
            }
        }
    },

    getByText: function (text) {
        return this.getByField("text", text);
    },

    getByValue: function (value) {
        return this.getByField("value", value);
    },

    getTagObject: function (tag) {
        if (this.tagDefaults) {
            tag = Ext.applyIf(tag, this.tagDefaults);
        }

        if ((tag.selected && (this.selectionMode == "none" || !this.selectionMode)) ||
            (tag.selected && this.selectionMode == "single" && this.getSelected().length > 0)) {
            tag.selected = false;
        }

        var cls = [
                "x-taglabel-item",
                tag.iconCls ? "x-taglabel-item-icon" : "",
                tag.iconCls && tag.iconCls.indexOf('#') === 0 ? X.net.RM.getIcon(tag.iconCls.substring(1)) : (tag.iconCls || ""),
                tag.disabled ? "x-taglabel-item-disabled" : "",
                tag.cls || "",
                tag.selected ? "x-taglabel-item-selected" : ""
        ],
            o;

        cls = Ext.Array.clean(cls);

        o = {
            tag: "li",
            cls: cls.join(" ")
        };

        if (tag.qTitle) {
            o["data-qtitle"] = tag.qTitle;
        }

        if (tag.qTip) {
            o["data-qtip"] = tag.qTip;

            if (!tag.qTitle) {
                o["data-qtitle"] = tag.text;
            }
        }

        if (tag.width) {
            o.style = "width:" + tag.width + "px;";
        }

        if (tag.style) {
            o.style = (o.style ? (o.style + " ") : "") + tag.style;
        }

        o.cn = [];

        o.cn.push({
            tag: "div",
            cls: "x-taglabel-item-text",
            html: Ext.String.ellipsis(tag.text, this.maxLength)
        });

        if (this.defaultClosable && tag.closable !== false || tag.closable) {
            tag.closable = true;
            o.cls = o.cls + " x-taglabel-closable";
            o.cn.push({
                tag: "div",
                cls: "x-taglabel-close-btn"
            });
        }

        return o;
    },

    indexOf: function (tag) {
        var i = Ext.Array.indexOf(this.tags, tag);
        if (i >= 0) {
            return i;
        }

        if (Ext.isString(tag) || Ext.isNumber(tag)) {
            for (i = 0; i < this.tags.length; i++) {
                if (this.tags[i].value == tag || this.tags[i].text == tag) {
                    return i;
                }
            }
        }

        for (var i = 0; i < this.tags.length; i++) {
            if (this.tags[i].value == tag.value || this.tags[i].text == tag.text) {
                return i;
            }
        }
    },

    insert: function (index, tag) {
        if (this.tagsMax && this.tags.length >= this.tagsMax) {
            return;
        }

        var i,
            o,
            el,
            closeEl,
            tagArr,
            updateIndexes = true;

        if (!Ext.isObject(tag)) {
            if (Ext.isString(tag) && this.valueDelimeter && tag.indexOf(this.valueDelimeter) > -1) {
                tagArr = Ext.Array.clean(tag.split(this.valueDelimeter));
                tag = { text: tagArr[0], value: tagArr[1] };
            }
            else {
                tag = { text: tag };
            }
        }

        if (Ext.isDefined(tag.value) && this.getByValue(tag.value)) {
            return;
        }

        if (!this.allowDuplicates && this.getByText(tag.text)) {
            return;
        }

        if (!this.rendered) {
            return;
        }

        o = this.getTagObject(tag);
        o["data-index"] = index;

        if (this.fireEvent("beforetagadd", this, tag, o, index) !== false) {
            if (index >= this.tags.length) {
                this.tags.push(tag);
                updateIndexes = false;
            }
            else {
                this.tags = Ext.Array.insert(this.tags, index, [tag]);
            }

            if (index >= (this.tags.length - 1)) {
                if (this.inputLi && this.ulEl.last("li") == this.inputLi) {
                    el = Ext.DomHelper.insertBefore(this.inputLi, o, true);
                }
                else {
                    el = Ext.DomHelper.append(this.ulEl, o, true);
                }
            }
            else {
                el = this.tags[index + 1].el;// this.ulEl.query("li[data-index=" + index + "]")[0];
                if (el) {
                    el = Ext.DomHelper.insertBefore(el, o, true);
                }
                else {
                    el = Ext.DomHelper.append(this.ulEl, o, true);
                }
            }

            if (tag.closable) {
                closeEl = Ext.get(el.query(".x-taglabel-close-btn")[0]);
                closeEl.hover(function () {
                    !this.tag.disabled && this.el.addCls("x-taglabel-close-btn-over");
                },
                function () {
                    !this.tag.disabled && this.el.removeCls("x-taglabel-close-btn-over");
                }, { tag: tag, el: closeEl });

                closeEl.on("click", function () {
                    !this.tag.disabled && this.label.remove(this.tag);
                }, { label: this, tag: tag });
            }

            if (this.trackOver) {
                el.hover(function () {
                    !this.tag.disabled && this.el.addCls("x-taglabel-item-over");
                }, function () {
                    !this.tag.disabled && this.el.removeCls("x-taglabel-item-over");
                }, { tag: tag, el: el });
            }

            if (tag.overCls) {
                el.hover(function () {
                    !this.tag.disabled && this.el.addCls(this.tag.overCls);
                }, function () {
                    !this.tag.disabled && this.el.removeCls(this.tag.overCls);
                }, { tag: tag, el: el });
            }

            tag.el = el;

            this.fireEvent("tagadd", this, tag, el, index);

            if (updateIndexes) {
                this.updateIndexes();
            }

            this.onTagsChange();

            return el;
        }
    },

    add: function (tag, multiple) {
        if (Ext.isString(tag) && multiple) {
            tag = Ext.Array.clean(tag.split(this.tagsDelimeter));
        }

        if (Ext.isArray(tag)) {
            this.ignoreChange++;
            for (var i = 0; i < tag.length; i++) {
                this.add(tag[i]);
            }
            this.ignoreChange--;
            this.onTagsChange();
            return;
        }

        this.insert(this.tags.length, tag);
    },

    set: function (tags, multiple) {
        this.ignoreChange++;
        this.removeAll();
        this.add(tags, multiple);
        this.ignoreChange--;
        this.onTagsChange();
    },

    getTagByParam: function (tag) {
        

        if (Ext.isString(tag) || Ext.isNumber(tag)) {
            for (var i = 0; i < this.tags.length; i++) {
                if (this.tags[i].value == tag || this.tags[i].text == tag) {
                    tag = this.tags[i];
                    break;
                }
            }
        }

        return tag;
    },

    remove: function (tag) {
        var i, last;

        if (Ext.isArray(tag)) {
            this.ignoreChange++;
            for (i = tag.length - 1; 0 <= i; i--) {
                this.remove(tag[i]);
            }
            this.ignoreChange--;
            this.onTagsChange();

            return;
        }

        tag = this.getTagByParam(tag);

        if (this.fireEvent("beforetagremove", this, tag) !== false) {
            last = this.tags[this.tags.length - 1] === tag;
            this.tags = Ext.Array.remove(this.tags, tag);
            tag.el.remove();

            if (!last) {
                this.updateIndexes();
            }

            this.fireEvent("tagremove", this, tag);
        }

        this.onTagsChange();

        if (this.menu && this.menu.isVisible()) {
            this.menu.hide();
        }
    },

    onTagsChange: function () {
        if (this.ignoreChange) {
            return;
        }

        this.applyEmptyText();
        this.afterChange();
    },

    afterChange: Ext.emptyFn,

    applyEmptyText: function () {
        var empty = this.tags.length === 0,
            visible;

        if (this.emptyText) {
            visible = empty && !this.inputElHasFocus;
            this.emptyEl.setDisplayed(visible);
            this.emptyEl.dom.innerHTML = visible ? this.emptyText : "";
        }
    },

    onInputElFocus: function () {
        this.inputElHasFocus = true;
        this.applyEmptyText();
    },

    onInputElBlur: function () {
        this.inputElHasFocus = false;
        this.applyEmptyText();
    },

    removeAll: function () {
        this.remove(this.tags);
    },

    getValue: function (field, delimeter) {
        var i,
            buf = [];

        for (i = 0; i < this.tags.length; i++) {
            if (field) {
                buf.push(this.tags[i][field]);
            }
            else {
                buf.push(Ext.isDefined(this.tags[i].value) ? this.tags[i].value : this.tags[i].text);
            }
        }

        return delimeter === false ? buf : buf.join(delimeter || ",");
    },

    getSelected: function () {
        var i,
            buf = [];

        for (i = 0; i < this.tags.length; i++) {
            if (this.tags[i].selected) {
                buf.push(this.tags[i]);
            }
        }

        return buf;
    },

    onclick: function (tag, e) {
        var mode = this.selectionMode;

        if (e.getTarget(".x-taglabel-close-btn")) {
            return false;
        }

        if (!tag.disabled
            && mode
            && mode != "none"
            && !((mode == "single" || mode == "multi") && !e.ctrlKey && tag.selected)
            && this.fireEvent("beforeselect", this, tag, e) !== false) {

            if (mode == "multi") {
                mode = e.ctrlKey ? "simple" : "single";
            }

            if (mode == "single") {
                Ext.each(this.tags, function (t) {
                    if (t != tag) {
                        t.selected = false;
                        t.el.removeCls("x-taglabel-item-selected");
                    }
                });
            }

            tag.selected = !tag.selected;
            tag.el.toggleCls("x-taglabel-item-selected");
            this.fireEvent("select", this, tag, e);
        }

        if (!tag.disabled && this.menu && this.menuOnLeftClick && !this.ignoreNextClick) {
            this.menu.activeTag = tag;
            this.menu.showBy(tag.el, this.menuAlign);
        }
    },

    ondblclick: function (tag, e) {
        if (!tag.disabled && this.removeOnDblClick) {
            this.remove(tag);
        }
    },

    oncontextmenu: function (tag, e) {
        if (!tag.disabled && this.menu && !this.menuOnLeftClick) {
            e.preventDefault();
            this.menu.activeTag = tag;
            this.menu.showBy(tag.el, this.menuAlign);
        }
    },

    onMenuShow: function (e) {
        var me = this;
        me.ignoreNextClick = 0;
    },

    onMenuHide: function (e) {
        var me = this;
        me.ignoreNextClick = Ext.defer(me.restoreClick, 250, me);
    },

    restoreClick: function () {
        this.ignoreNextClick = 0;
    },

    onkeydown: function (e) {

    },

    handleEvent: function (e) {
        var me = this,
            tag,
            li,
            index,
            key = e.type == 'keydown' && e.getKey();

        if (key) {
            this.onkeydown(e);
            return;
        }

        li = e.getTarget("li");
        index = li && Ext.fly(li).getAttribute("data-index");
        if (index) {
            index = parseInt(index, 10);
            tag = this.tags[index];

            if (this["on" + e.type](tag, e) !== false) {
                this.fireEvent(e.type, this, tag, e);
            }
        }
    },

    setTagText: function (tag, text) {
        tag = this.getTagByParam(tag);

        tag.text = text;
        tag.el.query("div.x-taglabel-item-text")[0].innerHTML = text;
    },

    setTagIconCls: function (tag, iconCls) {
        tag = this.getTagByParam(tag);

        if (tag.iconCls) {
            tag.el.removeCls(tag.iconCls);
        }

        if (!iconCls) {
            tag.el.removeCls("x-taglabel-item-icon");
            tag.iconCls = "";
            return;
        }

        tag.iconCls = iconCls;
        tag.el.addCls(["x-taglabel-item-icon", iconCls.indexOf('#') === 0 ? X.net.RM.getIcon(iconCls.substring(1)) : iconCls]);
    },

    setTagCls: function (tag, cls) {
        tag = this.getTagByParam(tag);

        if (tag.cls) {
            tag.el.removeCls(tag.cls);
        }

        if (!cls) {
            tag.cls = "";
            return;
        }

        tag.cls = cls;
        tag.el.addCls(cls);
    },

    setTagDisabled: function (tag, disabled) {
        tag = this.getTagByParam(tag);

        tag.disabled = disabled;
        tag.el[disabled ? "addCls" : "removeCls"]("x-taglabel-item-disabled");
    },

    beforeDestroy: function () {
        var me = this;
        if (me.menu && me.destroyMenu !== false) {
            Ext.destroy(me.menu);
        }
        me.callParent();
    },

    moveInput: function (dir) {
        if (this.inputLi) {
            var el = dir == -1 ? this.inputLi.prev("li") : this.inputLi.next("li");
            if (el) {
                dir == -1 ? this.inputLi.insertBefore(el) : this.inputLi.insertAfter(el);
            }
        }
    },

    getInputPostion: function () {
        var el,
            index = this.tags.length - 1;
        if (this.inputLi) {
            el = this.inputLi.prev("li");
            if (!el) {
                return 0;
            }

            return parseInt(el.dom.getAttribute("data-index"), 10) + 1;
        }

        return index;
    }
});

Ext.util.Format.tags = function (value, config) {
    config = config || {};

    var buf,
        body,
        i,
        tag,
        o,
        emptyText = config.emptyText;

    if (Ext.isString(value)) {
        value = Ext.Array.clean(value.split(","));
    }

    if (value && value.length) {
        body = [];

        for (i = 0; i < value.length; i++) {
            tag = value[i];

            if (Ext.isString(tag)) {
                tag = { text: Ext.String.trim(tag) };
            }

            o = Ext.net.TagLabel.prototype.getTagObject.call(config || {}, tag);
            body.push(Ext.DomHelper.markup(o));
        }

        body = body.join("");
    }
    else {
        body = emptyText && (!value || !value.length) ? ('<span class="x-taglabel-empty">' + emptyText + '</span>') : '';
    }

    buf = [
        '<div class="x-taglabel">',
            '<ul class="x-taglabel-list">',
                body,
            '</ul>',
        '</div>'
    ];

    return buf.join("");
};

Ext.define('Ext.grid.column.Tag', {
    extend: 'Ext.grid.column.Column',
    alias: ['widget.tagcolumn'],

    defaultRenderer: function (value) {
        return Ext.util.Format.tags(value, this.tagLabelCfg);
    }
});

Ext.define('Ext.net.TagField', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.tagfield',

    createNewOnBlur: false,
    createNewOnEnter: true,
    createNewOnSpace: false,
    createNewOnSelect: true,
    collapseOnSelect: null,
    inputMoving: true,
    hideSelected: false,
    defaultClosable: true,
    delimiter: ",",
    encodeOnCreate: false,
    valueMode: "array",

    initComponent: function () {
        var me = this;
        me.grow = false;
        this.addCls("x-tagcombo");
        this.multiSelect = false;

        this.store = this.initTagsStore();
        me.callParent(arguments);

        var task = new Ext.util.TaskRunner(50);
        task.start({
            interval: 0,
            run: this.checkInputElChange,
            scope: this
        });
        this.pollTask = task;
    },

    initTagsStore: function () {
        if (Ext.isArray(this.store)) {
            this.displayField = "text";
            this.valueField = "value";

            return new Ext.data.Store({
                data: this.store,
                fields: [
                    "text",
                    "value",
                    "selected",
                    "iconCls",
                    "disabled",
                    "cls",
                    "qTitle",
                    "qTip",
                    "width",
                    "style",
                    "closable",
                    "overCls"
                ],
                autoDestroy: true
            });
        }

        return this.store;
    },

    initEvents: function () {
        var me = this,
            events = me.checkChangeEvents,
            event,
            e,
            eLen = events.length;

        me.callParent(arguments);

        if (!me.enableKeyEvents) {
            me.mon(me.inputEl, 'keydown', me.onKeyDown, me);
        }

        me.mon(me.inputEl, 'paste', me.onInputElPaste, me, { buffer: 50 });
        me.mon(this.inputCell || this.bodyEl, 'click', me.onBodyElClick, me);

        if (!me.editable) {
            me.mun(me.inputEl, 'click', me.onTriggerClick, me);
            me.inputEl.setDisplayed(false);
        }

        me.mun(me.inputEl, Ext.EventManager.getKeyEvent(), me.fireKey, me);

        for (e = 0; e < eLen; e++) {
            event = events[e];
            me.mun(me.inputEl, event, me.onChangeEvent);
        }

        me.usesPropertychange = false;
    },

    setEditable: function (editable) {
        me.inputEl.setDisplayed(editable);
        this.callParent();
    },

    beforeLayout: function () {
        var me = this;

        me.callParent(arguments);

        if (!me.tagLabel) {
            me.initTagLabel();
        }
    },

    initTagLabel: function () {
        var me = this;

        (this.inputCell || this.bodyEl).addCls(["x-form-field", "x-form-text", "x-field-buttons-body"]);
        this.bodyEl.addCls("x-field-toolbar-body");

        this.inputEl.addCls = Ext.Function.createSequence(this.inputEl.addCls, function (cls) {
            (this.inputCell || this.bodyEl).addCls(cls);
        }, this);

        this.inputEl.removeCls = Ext.Function.createSequence(this.inputEl.removeCls, function (cls) {
            (this.inputCell || this.bodyEl).removeCls(cls);
        }, this);

        me.tagLabel = new Ext.net.TagLabel(Ext.apply({
            emptyText: me.emptyText || '',
            field: me,
            inputEl: me.inputEl,
            defaultClosable: me.defaultClosable,
            afterChange: Ext.Function.bind(me.afterTagsChange, me),
            tagsDelimeter: me.delimiter,
            renderTo: me.inputEl.parent().dom
        }, {
            tags: this.value || []
        }, me.tagLabelCfg || {}));

        if (me.tagLabel.stacked) {
            this.addCls("x-tagcombo-stacked");
        }

        me.tagLabel.checkTab = Ext.Function.bind(this.checkTab, this);

        this.checkInputElChange();
        this.afterTagsChange();
    },

    applyEmptyText: Ext.emptyFn,

    afterTagsChange: function () {
        if (this.tagLabel) {
            this.value = this.tagLabel.tags;
        }
        this.checkChange();
        this.applyEmptyText();
        this.syncSelection();
    },

    checkInputElChange: function () {
        if (this.rendered) {
            var value = Ext.util.Format.htmlEncode(this.inputEl.dom.value || "") + this.growAppend + this.growAppend + this.growAppend;
            this.inputEl.setWidth(this.inputEl.getTextWidth(value));
        }
    },

    onDestroy: function () {
        if (this.tagLabel) {
            Ext.destroy(this.tagLabel);
        }

        var task = this.pollTask;
        if (task) {
            task.stopAll();
            delete this.pollTask;
        }

        this.callParent();
    },

    onItemClick: Ext.emptyFn,

    onListSelectionChange: Ext.emptyFn,

    getValue: function () {
        var state = [],
            value,
            record;

        Ext.each(this.value, function (obj) {
            state.push(obj.value);
        }, this);

        return this.valueMode == "array" ? state : state.join(this.getDelimeter());
    },

    getDelimeter: function () {
        if (this.tagLabel) {
            return this.tagLabel.tagsDelimeter;
        }

        if (this.tagLabelCfg && this.tagLabelCfg.tagsDelimeter) {
            return this.tagLabelCfg.tagsDelimeter;
        }

        return this.delimiter;
    },

    convertToTag: function (tag) {
        var me = this,
            record = tag,
            obj,
            v;

        if (!record || !record.isModel) {
            if (Ext.isObject(record)) {
                if (Ext.isDefined(record.value)) {
                    v = record.value;
                }
                else if (Ext.isDefined(record.text)) {
                    v = record.text;
                }
                else if (Ext.isDefined(record[me.valueField])) {
                    v = record[me.valueField];
                }
                else {
                    v = record[me.displayField];
                }

                if (Ext.isString(v)) {
                    v = Ext.String.trim(v);
                }

                record = me.findRecordByValue(v);
            }
            else {
                if (Ext.isString(record)) {
                    record = Ext.String.trim(record);
                }

                record = me.findRecordByValue(record);
            }
        }

        if (record) {
            obj = Ext.apply({}, record.data);
            obj.text = obj[me.displayField];
            obj.value = obj[me.valueField];
        }
        else {
            if (!me.forceSelection) {
                if (Ext.isObject(tag)) {
                    obj = Ext.apply({}, tag);

                    if (Ext.isDefined(obj[me.displayField])) {
                        obj.text = obj[me.displayField];
                    }

                    if (Ext.isDefined(obj[me.valueField])) {
                        obj.value = obj[me.valueField];
                    }
                }
                else {
                    obj = { text: tag, value: tag };
                }
            }
        }

        return obj;
    },

    addTag: function (tag) {
        this.setValue(tag, {
            append: true
        });
    },

    addTagToInput: function (tag) {
        if (!this.tagLabel) {
            this.addTag(tag);
        }

        this.setValue(tag, {
            index: this.tagLabel.getInputPostion()
        });
    },

    insertTag: function (index, tag) {
        this.setValue(tag, {
            index: index
        });
    },

    removeTag: function (tag) {
        this.setValue(tag, {
            remove: true
        });
    },

    convertValue: function (value) {
        if (!value) {
            value = [];
        }

        if (Ext.isString(value)) {
            value = Ext.Array.clean(value.split(this.getDelimeter()));
        }

        if (!Ext.isArray(value)) {
            value = [value];
        }

        return value;
    },

    setValue: function (value, opts) {
        var me = this,
            i,
            obj,
            v,
            matchedTags = [],
            len;

        opts = opts || { set: true };

        value = this.convertValue(value);

        if (this.store.loading) {
            me.value = value;
            return me;
        }

        for (i = 0, len = value.length; i < len; i++) {
            obj = this.convertToTag(value[i]);

            if (obj) {
                matchedTags.push(obj);
            }
        }

        if (matchedTags.length > 0) {
            if (this.tagLabel) {
                if (opts.append) {
                    this.tagLabel.add(matchedTags);
                }
                else if (Ext.isDefined(opts.index)) {
                    this.tagLabel.insert(opts.index, matchedTags[0]);
                }
                else if (opts.remove) {
                    for (i = 0; i < matchedTags.length; i++) {
                        obj = this.tagLabel.getByValue(matchedTags[i].value);

                        if (obj) {
                            this.tagLabel.remove(obj);
                        }
                    }

                } else {
                    this.tagLabel.set(matchedTags);
                }
            } else {
                if (opts.append) {
                    this.value = Ext.Array.push(this.value || [], matchedTags);
                }
                else if (Ext.isDefined(opts.index)) {
                    this.value = Ext.Array.insert(this.value, opts.index, matchedTags[0]);
                }
                else if (opts.remove) {
                    this.value = Ext.Array.remove(this.value, matchedTags[0]);
                }
                else {
                    this.value = matchedTags;
                }

                this.checkChange();
            }
        } else {
            if (!opts.append && !Ext.isDefined(opts.index) && !opts.remove) {
                if (this.tagLabel) {
                    this.tagLabel.set([]);
                } else {
                    delete this.value;
                    this.checkChange();
                }
            }
        }

        if (this.inputEl && this.emptyText && !Ext.isEmpty(this.value)) {
            this.inputEl.removeCls(this.emptyCls);
        }

        if (this.tagLabel && this.isExpanded) {
            this.alignPicker();
        }
    },

    assertValue: function () {
        var me = this,
            value = me.inputEl ? me.inputEl.dom.value : "",
            rec;

        if (me.createNewOnBlur && value) {
            if (me.encodeOnCreate) {
                value = Ext.String.htmlEncode(value);
            }

            rec = me.findRecordByDisplay(value);
            if (rec) {
                this.addTagToInput(rec);
            }
            else if (!me.forceSelection) {
                this.addTagToInput({ text: value, value: value });
            }
        }

        me.inputEl.dom.value = '';
        if (this.tagLabel) {
            Ext.defer(function () {
                this.tagLabel.ulEl.appendChild(this.tagLabel.inputLi);
            }, 1, this);
        }
        me.collapse();
    },

    getRawValue: function () {
        var me = this,
        inputEl = me.inputEl,
        result;
        me.inputEl = false;
        result = me.callParent(arguments);
        me.inputEl = inputEl;
        return result;
    },

    setRawValue: function (value) {
        var me = this,
        inputEl = me.inputEl,
        result;

        me.inputEl = false;
        result = me.callParent([value]);
        me.inputEl = inputEl;

        return result;
    },

    onKeyDown: function (e, t) {
        var me = this,
            key = e.getKey(),
            rawValue = me.inputEl.dom.value,
            pos = me.getCursorPosition(),
            stopEvent = false;

        if (me.readOnly || me.disabled || !me.editable) {
            return;
        }

        if (me.isExpanded && (key == e.A && e.ctrlKey)) {
            me.select(me.getStore().getRange());
            me.collapse();
            me.inputEl.focus();
            stopEvent = true;
        }

        if (stopEvent) {
            me.preventKeyUpEvent = stopEvent;
            e.stopEvent();
            return;
        }

        if (key == e.ENTER && rawValue.length != 0) {
            e.stopEvent();
        } else if (key == e.LEFT) {
            if (pos == 0 && me.inputMoving) {
                me.tagLabel.moveInput(-1, pos);
                me.focus();
                me.selectText(0, 0);
            }
        } else if (key == e.RIGHT) {
            if (pos == rawValue.length && me.inputMoving) {
                me.tagLabel.moveInput(1, pos);
                me.focus();
                me.selectText(pos, pos);
            }
        }

        if (me.isExpanded && (key == e.ENTER) && me.picker.highlightedItem) {
            me.preventKeyUpEvent = true;
        }

        if (me.enableKeyEvents) {
            me.callParent(arguments);
        }
    },

    onKeyUp: function (e, t) {
        var me = this,
            key = e.getKey(),
            rawValue = me.inputEl.dom.value;

        if (me.preventKeyUpEvent) {
            e.stopEvent();
            delete me.preventKeyUpEvent;
            return;
        }

        if (me.readOnly || me.disabled || !me.editable) {
            return;
        }

        if (((me.createNewOnEnter && key == e.ENTER) || (me.createNewOnSpace && key == e.SPACE)) && rawValue) {
            if (me.encodeOnCreate) {
                rawValue = Ext.String.htmlEncode(rawValue);
            }

            rawValue = Ext.Array.clean(rawValue.split(this.getDelimeter()));
            me.inputEl.dom.value = '';
            me.addTagToInput(rawValue);
            me.store.clearFilter();
            me.inputEl.focus();
            e.stopEvent();

            return false;
        }

        me.lastKey = key;
        if (!e.isSpecialKey() || key == e.BACKSPACE || key == e.DELETE) {
            me.doQueryTask.delay(me.queryDelay);
        }
    },

    getSubmitArray: function () {
        var state = [],
            value,
            record;

        Ext.each(this.value, function (obj) {
            state.push({
                value: obj.value,
                text: obj.text,
                selected: !!obj.selected
            });
        }, this);

        return state;
    },

    getSubTplData: function () {
        var me = this,
            data = me.callParent(),
            isEmpty = me.emptyText && data.value.length < 1;

        data.value = '';
        data.placeholder = '';
        data.inputElCls = '';

        return data;
    },

    onInputElPaste: function () {
        var me = this,
            rawValue = me.inputEl.dom.value;

        rawValue = Ext.Array.clean(rawValue.split(this.getDelimeter()));
        me.inputEl.dom.value = '';
        me.addTagToInput(rawValue);
        me.store.clearFilter();
        me.inputEl.focus();
    },

    onBodyElClick: function (e, t) {
        var me = this,
            tagEl = e.getTarget('.x-taglabel-item');

        if (me.readOnly || me.disabled) {
            return;
        }

        if (!tagEl) {
            if (!me.editable) {
                me.onTriggerClick();
            }
            else {
                this.inputEl.focus();
            }
        }
    },

    isEqual: function (v1, v2) {
        var fromArray = Ext.Array.from,
            valueField = this.valueField,
            i, len, t1, t2;

        v1 = fromArray(v1);
        v2 = fromArray(v2);
        len = v1.length;

        if (len !== v2.length) {
            return false;
        }

        for (i = 0; i < len; i++) {
            t1 = Ext.isDefined(v1[i].value) ? v1[i].value : v1[i];
            t2 = Ext.isDefined(v2[i].value) ? v2[i].value : v2[i];
            if (t1 !== t2) {
                return false;
            }
        }

        return true;
    },

    checkChange: function () {
        if (!this.suspendCheckChange) {
            var me = this,
                newVal = me.value || [],
                oldVal = me.lastValue;
            if (!me.isEqual(newVal, oldVal) && !me.isDestroyed) {
                me.lastValue = Ext.Array.clone(newVal);
                me.fireEvent('change', me, newVal, oldVal);
                me.onChange(newVal, oldVal);
                this.checkTriggerHeight();
            }
        }
    },

    checkTriggerHeight: function () {
        if (this.rendered) {
            var td = this.triggerCell.elements ? this.triggerCell.elements[0] : this.triggerCell;
            if (td && td.getHeight() > 25) {
                this._bottomColor = td.getStyle("border-bottom-color");
                td.setStyle("border-bottom-width", 0);

                if (Ext.net.ResourceMgr.theme !== "neptune" && this.triggerEl) {
                    this.triggerEl.setStyle({
                        "border-bottom-width": "1px",
                        "border-bottom-style": "solid",
                        "border-bottom-color": this._bottomColor
                    });
                }
            }
            else if (td && this._bottomColor) {
                if (Ext.net.ResourceMgr.theme !== "neptune" && this.triggerEl) {
                    this.triggerEl.setStyle("border-bottom-width", "0px");
                }

                td.setStyle({
                    "border-bottom-width": "1px",
                    "border-bottom-color": this._bottomColor
                });

                delete this._bottomColor;
            }
        }
    },

    initValue: function () {
        this.callParent(arguments);

        if (!this.originalValue) {
            this.originalValue = [];
        }

        if (!this.lastValue) {
            this.lastValue = [];
        }
    },

    getCursorPosition: function () {
        var cursorPos;
        if (Ext.isIE10m) {
            cursorPos = document.selection.createRange();
            cursorPos.collapse(true);
            cursorPos.moveStart("character", -this.inputEl.dom.value.length);
            cursorPos = cursorPos.text.length;
        } else {
            cursorPos = this.inputEl.dom.selectionStart;
        }
        return cursorPos;
    },

    syncSelection: function () {
        var me = this,
        picker = me.picker,
        valueField = me.valueField,
        pickStore, selection, selModel;

        if (picker) {
            pickStore = picker.store;

            selection = [];
            if (me.value && me.value.length) {
                Ext.each(me.value, function (tag) {
                    var i = pickStore.findExact(valueField, tag.value);
                    if (i >= 0) {
                        selection.push(pickStore.getAt(i));
                    }
                });
            }

            me.ignoreSelection++;
            selModel = picker.getSelectionModel();
            selModel.deselectAll();
            if (selection.length > 0) {
                selModel.select(selection);
            }
            if (me.ignoreSelection > 0) {
                --me.ignoreSelection;
            }

            this.inputEl.focus();
        }
    },

    createPicker: function () {
        this.multiSelect = true;
        var picker = this.callParent(arguments);
        this.multiSelect = false;

        this.mon(picker.getSelectionModel(), {
            select: this.onItemSelect,
            deselect: this.onItemDeselect,
            scope: this
        });

        if (this.hideSelected) {
            this.picker.addCls("x-hide-selection");
        }

        return picker;
    },

    onItemSelect: function (sm, record) {
        var me = this;

        if (me.ignoreSelection || !me.isExpanded) {
            return;
        }

        me.inputEl.dom.value = "";

        if (!me.createNewOnSelect) {
            me.inputEl.dom.value = record.get(me.displayField);
            if (me.collapseOnSelect !== false) {
                me.collapse();
            }

            me.ignoreSelection++;
            sm.deselect(record);
            me.ignoreSelection--;
        }
        else {
            me.addTagToInput(record);

            if (me.collapseOnSelect === true) {
                me.collapse();
            }
        }

        me.fireEvent("select", me, record);
        me.store.clearFilter();
        me.inputEl.focus();
    },

    onItemDeselect: function (sm, record) {
        var me = this;

        if (me.ignoreSelection || !me.isExpanded) {
            return;
        }

        me.removeTag(record);
    },

    afterQuery: function (queryPlan) {
        var me = this;

        if (me.store.getCount()) {
            if (me.typeAhead) {
                me.doTypeAhead();
            }

            if (queryPlan.rawQuery) {
                me.syncSelection();
                if (me.picker && !me.picker.getSelectionModel().hasSelection()) {
                    me.doAutoSelect();
                }
            } else {
                me.doAutoSelect();
            }
        }
    },

    doRawQuery: function () {
        this.doQuery(this.inputEl.dom.value, false, true);
    },

    onTypeAhead: function () {
        var me = this,
            displayField = me.displayField,
            inputElDom = me.inputEl.dom,
            boundList = me.getPicker(),
            tagLabel = me.tagLabel,
            newValue,
            fn,
            len,
            selStart;

        if (me.hideSelected) {
            fn = this.createFilterFn(displayField, inputElDom.value);
            record = me.store.findBy(function (rec) {
                return (tagLabel.getByText(rec.get(displayField)) && fn(rec));
            });
            record = (record === -1) ? false : me.store.getAt(record);
        } else {
            record = me.store.findRecord(displayField, inputElDom.value);
        }

        if (record) {
            newValue = record.get(displayField);
            len = newValue.length;
            selStart = inputElDom.value.length;

            boundList.highlightItem(boundList.getNode(record));

            if (selStart !== 0 && selStart !== len) {
                inputElDom.value = newValue;
                me.selectText(selStart, newValue.length);
            }
        }
    },

    expand: function () {
        var picker = this.getPicker(),
            removeCls = false;
        if (!picker.rendered) {
            picker.addCls("x-hide-visibility");
            removeCls = true;
        }

        this.callParent(arguments);

        if (removeCls) {
            picker.removeCls("x-hide-visibility");
        }
    },

    onExpand: function () {
        var me = this,
            keyNav = me.listKeyNav;

        me.callParent(arguments);

        if (keyNav || !me.hideSelected) {
            return;
        }
        keyNav = me.listKeyNav;
        keyNav.highlightAt = function (index) {
            var boundList = this.boundList,
                item = boundList.all.item(index),
                len = boundList.all.getCount(),
                direction;

            if (item && item.hasCls('x-boundlist-selected')) {
                if ((index == 0) || !boundList.highlightedItem || (boundList.indexOf(boundList.highlightedItem) < index)) {
                    direction = 1;
                } else {
                    direction = -1;
                }
                do {
                    index = index + direction;
                    item = boundList.all.item(index);
                } while ((index > 0) && (index < len) && item.hasCls('x-boundlist-selected'));

                if (item && item.hasCls('x-boundlist-selected')) {
                    return;
                }
            }

            if (item) {
                item = item.dom;
                boundList.highlightItem(item);
                boundList.getTargetEl().scrollChildIntoView(item, false);
            }
        };
    }
});
