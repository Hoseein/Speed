
// @source core/form/FormPanel.js

Ext.form.Panel.override({
    validate: function () {
        return this.getForm().isValid();
    },

    getName: function () {
        return this.id || '';
    },

    clearInvalid: function () {
        return this.getForm().clearInvalid();
    },

    markInvalid: function (msg) {
        return this.getForm().markInvalid(msg);
    },

    getValue: function () {
        return this.getForm().getValues();
    },

    setValue: function (value) {
        return this.getForm().setValues(value);
    },

    // Introduced on ExtJS 6.0.2: the resetRecord argument.
    reset: function (resetRecord) {
        return this.getForm().reset(resetRecord);
    },

    setUrl: function (value) {
        var form = this.getForm();

        this.url = value;

        if (form) {
            form.url = value
        }
    },

    setWaitMsgTarget: function (value) {
        var form = this.getForm();

        this.waitMsgTarget = value;

        if (form) {
            form.waitMsgTarget = value
        }
    }
});