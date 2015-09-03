Ext.define('Rally.technicalservices.RiskToolbox',{
    singleton: true,

    riskField: 'c_SecurityBusinessRisk',
    riskValue: 'High',
    riskRegex: 'Business risk: High',

    isRisk: function(r){

        var description = r.get('Description'),
            is_risk = false,
            risk_regex = new RegExp(this.riskRegex,"gi");

        if (risk_regex.test(description)){
            is_risk = true;
        }

        if (r.get(this.riskField) == this.riskValue){
            is_risk = true;
        }
        return is_risk;
    }
});
