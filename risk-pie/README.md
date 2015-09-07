#High Risk Committed Pie

For all user stories that are tagged with a particular tag (configured through the app settings), show the break down of the stories that are marked as "High Risk" as "Committed", "Non-Committed" or "Accepted".

![ScreenShot](/images/risk-pie.png)

A story is marked as "High Risk" if the custom field "Security Business Risk" is set to "High" or there is a string in the Description that matches "Business risk: High".  

A story is bucketed as "Accepted" if the story is in a state greater than or equal to Completed (this is also a setting).  

A story is bucketed as "Committed" if the story is scheduled into an iteration that ends before the selected End Date.  

A story is bucketed as "Non-Committed" if the story is scheduled into an iteration that ends after the selected End Date, or if the story is not scheduled in an iteration.

