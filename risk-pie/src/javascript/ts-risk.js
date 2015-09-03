Ext.define('Rally.technicalservices.chart.FeatureRisk', {
    extend: 'Ext.panel.Panel', //'Rally.ui.chart.Chart',
    alias: 'widget.tsriskpie',

    config: {
        timeboxScope: undefined,
        dataFetch: ["FormattedID","Name","Project","Iteration","EndDate","ScheduleState","Description"],
        records: undefined,
        benchmarkDate: undefined,
        completedScheduleStates: undefined
    },
    height: 300,
    border: 0,
    layout: {type: 'hbox'},
    AcceptedColor: '#145499',
    CommittedColor: '#8bbc21',
    NonCommittedColor: '#f28f43',

    constructor: function(config) {
        this.mergeConfig(config);
        this.callParent([this.config]);
    },
    initComponent: function() {
        this.callParent(arguments);
        this._showSummaryView(this.records);
    },
    _showSummaryView: function(records){

        var chart = this.add({
            xtype: 'rallychart',
            loadMask: false,
            chartConfig: this._getSummaryChartConfig(),
            chartData: this._getSummaryChartData(records)
        });
        chart.setHeight(this.height - 25);
        chart.setWidth(this.width);
    },
    _getSummaryChartData: function(records){
        var data = this._getSummaryData(records);

        return {
            series: [{
                name: 'Risk Color',
                data: data,
                size: '80%',
                dataLabels: {
                    formatter: function(){
                        return this.point.name + ': ' + this.y + '%'
                    }
                }
            }]
        };
    },
    _getSummaryData: function(records){
        var accepted = 0,
            non_commited = 0,
            committed = 0,
            benchmark_date = this.benchmarkDate;

        _.each(records, function(r){

            if (Rally.technicalservices.RiskToolbox.isRisk(r)){

                if (Ext.Array.contains(this.completedScheduleStates, r.get('ScheduleState'))){
                    accepted++;
                } else {
                    var date = null,
                        iteration = r.get('Iteration');

                    if (iteration){
                        date = Rally.util.DateTime.fromIsoString(iteration.EndDate)
                    }
                    console.log('date',iteration, date,benchmark_date, date < benchmark_date);
                    if (date < benchmark_date){
                        committed++;
                    } else {
                        non_commited++;
                    }
                }
            }
        }, this);

        var formatted_date = Rally.util.DateTime.format(this.benchmarkDate, 'm/d');

        return [{
            name: "Total Accepted",
            y: accepted,
            color: this.AcceptedColor
        },{
            name: 'Total Committed by ' + formatted_date,
            y: committed,
            color: this.CommittedColor
        },{
            name: 'Total Non-Committed after ' + formatted_date,
            y: non_commited,
            color: this.NonCommittedColor
        }];

    },

    _getSummaryChartConfig: function(){
        //var x = this.width * .35,
        //    y = this.height * .25 + 25;

        return  {
            colors: [
                this.AcceptedColor,
                this.CommittedColor,
                this.NonCommittedColor
            ],

            chart: {
                type: 'pie',
                options3d: {
                    enabled: true,
                    alpha: 45,
                    beta: 0
                }
            },
            title: {
                text: null
            },
            tooltip: {
                pointFormat: '<b>{point.y} User Stories</b> ({point.percentage:.1f}%)'
            },
            plotOptions: {
                pie: {
                    depth: 35,
                    dataLabels: {
                        enabled: true,
                        distance: 10,
                        style: {
                            color: 'black',
                            fontSize: '10px'
                        },
                        format: '{point.name}<br/>{point.y} User Stories ({point.percentage:.1f}%)'
                    }
                }
            },
            legend: {
                enabled: true
            }
        };
    },

    //Overriding this function because we want to set colors ourselves.
    _setChartColorsOnSeries: function (series) {
        return null;
    }
});

