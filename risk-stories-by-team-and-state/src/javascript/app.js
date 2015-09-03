Ext.define("risk-stories-by-team-and-state", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    autoScroll: false,
    states: ['Defined','In-Progress','Completed','Accepted'],
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

        this.completedStates =  _.rest(this.states, _.indexOf(this.states,"Accepted"));
        if (this.getSetting('combineCompletedAccepted') == 'true' || this.getSetting('combineCompletedAccepted') === true){
            this.completedStates = _.rest(this.states, _.indexOf(this.states,"Completed"));
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

        var fetch = ['FormattedID','ObjectID','Project','Description','ScheduleState','Name'],
            model = 'HierarchicalRequirement';

        Rally.technicalservices.WsapiToolbox.fetchWsapiRecords({model: model, fetch: fetch, filters: filters}).then({
            scope: this,
            success: function(records){
                this.logger.log('_fetchStories > records loaded', records.length);

                var filtered_records = this._filterRecords(records);

                this._buildGrid(filtered_records);
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
    _buildGrid: function(records){

        var tagged_stories_by_project = Rally.technicalservices.Toolbox.aggregateRecordsByField(records, "Project","Name");

        this.logger.log('_buildGrid', tagged_stories_by_project);
        var data = [];

        var states = this.states;
        _.each(tagged_stories_by_project, function(rec, project){
            var tagged_story_array = tagged_stories_by_project[project] || [];

            var tagged_stories_by_state = Rally.technicalservices.Toolbox.aggregateRecordsByField(tagged_story_array, "ScheduleState");
            var data_row = {
                project: project,
                tagged: tagged_story_array.length
            };
            _.each(states, function(state){
                var state_array = tagged_stories_by_state[state] || [];
                data_row[state] = state_array.length;
            });
            data.push(data_row);
        });

        if (this.down('#storygrid')){
            this.down('#storygrid').destroy();
        }
        this.add({
            xtype: 'rallygrid',
            itemId: 'storygrid',
            store: Ext.create('Rally.data.custom.Store',{
                data: data,
                pageSize: data.length
            }),
            margin: 10,
            padding: 10,
            showPagingToolbar: false,
            scroll: 'vertical',
            columnCfgs: this._getColumnCfgs()
        });

    },
    _getColumnCfgs: function(){
        var cols = [{
            dataIndex: 'project',
            text: 'Team',
            flex: 1
        }];

        _.each(this.states, function(state){
            if (!Ext.Array.contains(this.completedStates,state)){
                cols.push({
                    dataIndex: state,
                    text:  state
                });
            }
        }, this);

        var completed_text = "Accepted";
        if (Ext.Array.contains(this.completedStates, "Completed")){
            completed_text = "Completed / Accepted";
        }

        cols.push({
            dataIndex: "Accepted",
            text: completed_text,
            scope: this,
            renderer: this._completedTotalRenderer
        });

        cols.push({
            dataIndex: 'tagged',
            text: 'Total High Risk'
        });

        cols.push({
            dataIndex: "Accepted",
            text: "% Completion",
            scope: this,
            renderer: this._completedPercentRenderer
        });

        return cols;
    },
    _completedPercentRenderer: function(v,m,r){
        var tagged = r.get('tagged') || 0;
        if (tagged > 0){
            var completed_total = 0;
            _.each(this.completedStates, function(state){
                completed_total += (r.get(state) || 0);
            });
            return Ext.String.format('{0} %', (completed_total/tagged * 100).toFixed(0));
        }
        return '0 %';
    },
    _completedTotalRenderer: function(v,m,r){
        var completed_total = 0;
        _.each(this.completedStates, function(state){
            completed_total += (r.get(state) || 0);
        });
        return completed_total;
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