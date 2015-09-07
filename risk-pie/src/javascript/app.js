Ext.define("risk-pie", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    autoScroll: false,
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    defaultDateString: '9/30/2015',
    config: {
        defaultSettings: {
            tagsOfInterest: [],
            combineCompletedAccepted: true
        }
    },
    launch: function(){
        this._validateSettings();
    },
    _validateSettings: function(){
        var tags = Rally.technicalservices.Toolbox.getSettingAsArray(this.getSetting('tagsOfInterest'));

        if (this.down('#display_box')){
            this.down('#display_box').destroy();
        }

        this.logger.log('_validateSettings > tags', tags);
        if (tags.length > 0){
            this.add({
                xtype: 'container',
                itemId: 'display_box',
                width: '95%'
            });
            Rally.technicalservices.WsapiToolbox.fetchScheduleStates().then({
                scope: this,
                success: function(states){
                    this.states = states;
                    this.completedStates =  _.rest(this.states, _.indexOf(this.states,"Accepted"));
                    if (this.getSetting('combineCompletedAccepted') == 'true' || this.getSetting('combineCompletedAccepted') === true){
                        this.completedStates = _.rest(this.states, _.indexOf(this.states,"Completed"));
                    }
                    this._fetchStories(tags);
                }
            });
        } else {
            this.add({
                xtype: 'container',
                itemId: 'display_box',
                html: 'No tags have been configured.  Please use the App Settings to configure at least one tag of interest.'
            });
        }
    },

    _fetchStories: function(tags){
        var me = this,
            tag_filter_objs = [];

        _.each(tags, function(tag){
            tag_filter_objs.push({
                property: 'Tags',
                operator: '=',
                value: tag
            });
        });

        var filters = Rally.data.wsapi.Filter.or(tag_filter_objs);

        this.logger.log('_fetchStories > filters', filters.toString());

        var fetch = ['FormattedID','ObjectID','Project','Description','ScheduleState','Iteration','Name','EndDate'],
            model = 'HierarchicalRequirement';

        Rally.technicalservices.WsapiToolbox.fetchWsapiRecords({model: model, fetch: fetch, filters: filters}).then({
            scope: this,
            success: function(records){
                this.logger.log('_fetchStories > records loaded', records.length);

                this.records = this._filterRecords(records);

                var default_date = new Date('9/30/2015');

                var dt = this.add({
                    xtype: 'rallydatefield',
                    fieldLabel: 'Committed Date',
                    labelAlign: 'right',
                    value: default_date,
                    stateEvents: ['change'],
                    stateId: this.getContext().getScopedStateId('benchmark-date'),
                    stateful: true,
                    listeners: {
                        scope: this,
                        change: this._update
                    }
                });

                if (!dt.getValue()){
                    dt.setValue(default_date);
                } else {
                    this._update(dt);
                }
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: msg});
            }
        }).always(function(){ me.setLoading(false);});
    },
    _filterRecords: function(records){
        var filtered_records = [];
        _.each(records, function(r){
            if (Rally.technicalservices.RiskToolbox.isRisk(r)){
                filtered_records.push(r);
            }
        }, this);
        return filtered_records;
    },
    _update: function(dt){
        this.logger.log('_update', dt.getValue());
        if (this.down('tsriskpie')){
            this.down('tsriskpie').destroy();
        }

        this.add({
            xtype: 'tsriskpie',
            width: this.getWidth() || 300,
            height: this.getHeight() || 300,
            benchmarkDate: dt.getValue(),
            records: this.records,
            completedScheduleStates: this.completedStates
        });

    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },

    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    getSettingsFields: function(){
        return [{
            xtype: 'rallytagpicker',
            name: 'tagsOfInterest',
            fieldLabel: 'Tags',
            labelWidth: 150,
            width: 400
        }];
    },
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    onSettingsUpdate: function (settings){
        this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        this._validateSettings();
    }
});
