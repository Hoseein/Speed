﻿Ext.toolbar.Breadcrumb.override({
    applySelection: function (node) {
        if (node !== 'root' && Ext.isString(node)) {
            var store = this.getStore();

            if (store) {
                node = store.getNodeById(node);
            }
        }
        return this.callParent([node]);
    },

    // That is only overridden for #835 and .hasId() call at the end.
    updateSelection: function (node) {
        var me = this,
            buttons = me._buttons,
            items = [],
            itemCount = Ext.ComponentQuery.query('[isCrumb]', me.getRefItems()).length,
            needsSync = me._needsSync,
            displayField = me.getDisplayField(),
            showIcons, glyph, iconCls, icon, newItemCount, currentNode, text, button, id, depth, i, tooltip; // #835

        Ext.suspendLayouts();

        if (node) {
            currentNode = node;
            depth = node.get('depth');
            newItemCount = depth + 1;
            i = depth;

            while (currentNode) {
                id = currentNode.getId();

                button = buttons[i];

                if (!needsSync && button && button._breadcrumbNodeId === id) {
                    // reached a level in the hierarchy where we are already in sync.
                    break;
                }

                text = currentNode.get(displayField);
                tooltip = currentNode.get("qtip"); // #835

                if (button) {
                    // If we already have a button for this depth in the button cache reuse it
                    button.setText(text);
                    button.setTooltip(tooltip);
                } else {
                    // no button in the cache - make one and add it to the cache
                    button = buttons[i] = Ext.create({
                        isCrumb: true,
                        xtype: me.getUseSplitButtons() ? 'splitbutton' : 'button',
                        ui: me.getButtonUI(),
                        cls: me._btnCls + ' ' + me._btnCls + '-' + me.ui,
                        text: text,
                        tooltip: tooltip, // #835
                        showEmptyMenu: true,
                        // begin with an empty menu - items are populated on beforeshow
                        menu: {
                            listeners: {
                                click: '_onMenuClick',
                                beforeshow: '_onMenuBeforeShow',
                                scope: this
                            }
                        },
                        handler: '_onButtonClick',
                        scope: me
                    });
                }

                showIcons = this.getShowIcons();

                if (showIcons !== false) {
                    glyph = currentNode.get('glyph');
                    icon = currentNode.get('icon');
                    iconCls = currentNode.get('iconCls');

                    if (glyph) {
                        button.setGlyph(glyph);
                        button.setIcon(null);
                        button.setIconCls(iconCls); // may need css to get glyph
                    } else if (icon) {
                        button.setGlyph(null);
                        button.setIconCls(null);
                        button.setIcon(icon);
                    } else if (iconCls) {
                        button.setGlyph(null);
                        button.setIcon(null);
                        button.setIconCls(iconCls);
                    } else if (showIcons) {
                        // only show default icons if showIcons === true
                        button.setGlyph(null);
                        button.setIcon(null);
                        button.setIconCls(
                            (currentNode.isLeaf() ? me._leafIconCls : me._folderIconCls) + '-' + me.ui
                        );
                    } else {
                        // if showIcons is null do not show default icons
                        button.setGlyph(null);
                        button.setIcon(null);
                        button.setIconCls(null);
                    }
                }

                button.setArrowVisible(currentNode.hasChildNodes());
                button._breadcrumbNodeId = currentNode.getId();

                currentNode = currentNode.parentNode;
                i--;
            }

            if (newItemCount > itemCount) {
                // new selection has more buttons than existing selection, add the new buttons
                items = buttons.slice(itemCount, depth + 1);
                me.add(items);
            } else {
                // new selection has fewer buttons, remove the extra ones from the items, but
                // do not destroy them, as they are returned to the cache and recycled.
                for (i = itemCount - 1; i >= newItemCount; i--) {
                    me.remove(buttons[i], false);
                }
            }

        } else {
            // null selection
            for (i = 0; i < buttons.length; i++) {
                me.remove(buttons[i], false);
            }
        }

        Ext.resumeLayouts(true);

        /**
         * @event selectionchange
         * Fires when the selected node changes
         * @param {Ext.toolbar.Breadcrumb} this
         * @param {Ext.data.TreeModel} node The selected node (or null if there is no selection)
         */
        me.fireEvent('selectionchange', me, node);

        me._needsSync = false;

        if (this.hasId()) { // Added in Ext.NET
            this.getSelectionField().setValue(node ? node.getId() : "");
        }
    },

    getSelectionField: function () {
        if (!this.selectionField && this.hasId()) {
            var value = this.getSelection();
            if (value && value.isModel) {
                value = value.getId();
            }
            else {
                value = "";
            }

            this.selectionField = new Ext.form.Hidden({
                name: this.id,
                value: value
            });

            this.on("beforedestroy", function () {
                this.destroy();
            }, this.selectionField);

            if (this.hasId()) {
                this.selectionField.render(this.el.parent() || this.el);
            }
        }

        return this.selectionField;
    }
});