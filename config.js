//This variable is used to point the client-side code to the Google App Script server that handles data requests. Every time the code in Google App Script is modified, the server must be deployed again. When that happens the code returned by the function must be updated.
const gas_deployment_id='XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'


/***********************************************

Log Levels
0. None: Turns of logging
1. Trace: The most fine-grained logging.  Shows each call to each function
2. Debug: Omits call to simple utilities; shows all ohters
3. App: Like debug, but also omits calls to functions in the system.js file
4 (and above).  User defined.  log_level of 4 and above will only be
   displayed if the app developer indicates


************************************************/
const log_level =  4

// an array of strings of file names to ignore log statements which 
// originate therefrom
const supress_logs_from_files=[] // e.g. "system.js"
