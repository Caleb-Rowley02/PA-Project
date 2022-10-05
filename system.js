let current_menu=[]
const base=window.location.protocol + "//" + window.location.host + "/"

filename="system.js"// used to control logging



async function server_request(payload, callback){  log(3,arguments,filename,server_request)
    //This function is used to invoke a function in Google App Script to interact with Airtable. This is desireable so that we can isolate the information needed to interact with the data from the client browser.
    //if a callback is not provided  this function waits until the call is complete
    
    if(document.cookie){//cookies are used to manage authenticated user information. The cookies are sent to Google App Script to ensure that users have appropriate authication and credentials update the database.
      payload.cookie=document.cookie
    }
    console.log("const payload=`" + JSON.stringify(payload) + "`")//This is primarily useful for troubleshooting. The data passed to Google App Script is sent to the console.
    //The request for Google App Script is formatted.
    const options = { 
        method: "POST", 
        body: JSON.stringify(payload),
    }

    if(callback){// execute the requst and let callback handle the response
        fetch(gas_end_point, options)
        .then(response => response.json())
        .then(callback);
    }else{ //execute the request and wait for the response so it can be returned
        working()//This function is used to present a visual cue to the user that the site is performing an update.
        const reply = await fetch(gas_end_point, options)
        //The request is made of Google App Script and the response is set to "response"
        const response = await reply.json()
        working(false)

        if(response.error){
            // we trapped an error in the google apps script
            console.error("Error in Google Apps Script")
            throw response.error

        }
        console.log("in post data", response)     

        if(response.cookie){// if respoonse has a cookie, set it
            for(const entry of response.cookie){
                console.log("cookie returned",entry.name,"=",entry.data)
                set_cookie(entry.name,entry.data,response.cookie_days)
            }
        }
        //the response from google app script is returned.
        return response
    }
}

async function initialize_app(){ log(3,arguments,filename,initialize_app)
    //This function initializes the page when it is loaded.
    let state="{}"
    window.onpopstate = function (event) {
        // call the function built into the URL
        navigate(event.state)
        //window[event.state.fn](event.state)
    };
    //If the user is authenticated, populate the authenticated menu is loaded. Otherwise the unautheticated menu is loaded.
    if(get_cookie("auth")){
        build_menu(authenticated_menu)
    }else{
        console.log('about to build menu')
        build_menu(unauthenticated_menu)
        console.log('just built menu')
    }
    //setup the page to interact well with browser features.
    const params = url_parameters()
    history.replaceState(params,"",location.href)
    console.log("params->",params)
    navigate(params,false,false)

}


function navigate(parameters, show_url=true, place_in_browser_history=true){log(3,arguments,filename,navigate)
    //update history so we can navigate backward.  
    //update location so we can refresh and copy the URL.
    //any function called with navigate should build the whole canvas

    // if parameters is a string, parse it, otherwise, it's alread an object of parameters
    console.log('===========================parameters',parameters)
    if(typeof parameters ==="string"){

        var params=JSON.parse(parameters)

    }else{
        var params=parameters
        console.log('===============params',params)
    }
    if(place_in_browser_history){
      const url=location.href.split("?")[0] + "?" + json_params_for_url(params)
      if(show_url){
        history.pushState(params, "", url);
      }else{
        history.pushState(params, "", null);
      }
    }

    let fn=params.fn
    if(typeof fn === "string"){
        fn=window[fn] // convert a string to function
    }

    delete(params.fn)
    if(Object.keys(params).length===0){
        //if params is an empty object, don't send params
        fn()
    }else{
        if(params.params){
          fn(params.params)
        }else{
          fn(params)
        }  
    }
    
}

function build_menu(menu_data){log(3,arguments,filename,build_menu)
    current_menu.length=0 // reset the current menu
    const menu=[]
    const user_data=get_user_data() || []
    
    menu.push('<div><i id="menu-close" class="fas fa-times" onclick="hide_menu()" style="cursor: pointer;"></i></div>  ')
    for(const item of menu_data){
        add_menu_item(menu, item, user_data.roles)
    }
    console.log('menu_data',menu_data)
    tag("menu").innerHTML=menu.join("")
}
//used to add a menu item
function add_menu_item(menu, menu_data, roles){log(2,arguments,filename,add_menu_item)
    if(menu_data.menu && !menu_data.label){
        // it must be an import of another menu
        for(const item of menu_data.menu){
            add_menu_item(menu, item, roles) 
        }
        return
    }

    if(Object.keys(menu_data).length===0){
        // empty object, it's a divider
        menu.push("<div><hr></div>")
        return
    }
    if(menu_data.roles){
        // a role is specified, if role is not in the users set of roles, get out of here
        console.log("roles", roles)
        console.log("intersect(roles, menu_data.roles)",intersect(roles, menu_data.roles))
        console.log("menu_data.roles",menu_data.roles)
        if(intersect(roles, menu_data.roles).length===0){
            return
        }
    }
    if(menu_data.menu){
        // it's a submenu
        let label=menu_data.label
        
        if(typeof label==="function"){label=label()}

        menu.push(`<div class="menu-menu" onClick="toggle_sub_menu(this, 'menu-${menu_data.id}')"><i class="fas fa-chevron-down"></i>${label}</div><div class="sub-menu" id="menu-${menu_data.id}">`)
        for(const item of menu_data.menu){
            add_menu_item(menu, item, roles)
        }
        menu.push("</div>")
    }else{
        //this is a menu choice
        if(menu_data.function){
            current_menu.push(menu_data)
            let label=menu_data.label
            if(typeof label!=="string"){
                label=label()
            }
            menu.push(`<div class="menu-item" onClick="${menu_data.function}">${label}</div>`)
        }else{
            menu.push(`<div class="menu-item">${menu_data.label}</div>`)
        }
        if(menu_data.panel){
            menu.push(`<div  class="menu-panel" style="display:none" id="${menu_data.panel}"></div>`)
        }
    }
}

function show_menu(){log(3,arguments,filename,show_menu)
    //This function displays the menu
    tag("menu-button").style.display="none"
    tag("menu").style.display="block"
}
function hide_menu(){log(3,arguments,filename,hide_menu)
    //Used to hide the menu (show only the parallel lines)
    tag("menu-button").style.display="block"
    tag("menu").style.display="none"
}

function toggle_sub_menu(button, id){log(3,arguments,filename,working)
    //Used to expande and collapse submenus
    if(toggle(id)){
        button.getElementsByTagName("i")[0].className="fas fa-chevron-up"
    }else{
        button.getElementsByTagName("i")[0].className="fas fa-chevron-down"
    }
}

function working(status=true){log(3,arguments,filename)
    //used to present a visual cue (spinning wheel) to show that the app is processing
    try{  
        if(status){
            tag("hamburger").className="fas fa-spinner fa-pulse"
            tag("menu-close").className="fas fa-spinner fa-pulse"
        }else{
            tag("hamburger").className="fas fa-bars"
            tag("menu-close").className="fas fa-times"
        }
    }catch(e){
        console.error(e)        
    }
}

function show_message(message, tag_or_id, seconds){log(3,arguments,filename,show_message)
    //used to display alerts to the user. The alert can be set to disappear after a specified number of seconds.
  console.log("at show message", tag_or_id, message)

  let element=tag_or_id
  if(!element.tagName){
      // assume caller passed in a tag id
      element=tag(tag_or_id)
  }

  element.style.display="block"
  element.innerHTML=message
   if(seconds && seconds>0){
     setTimeout(function(){element.style.display="none";element.innerHTML=""}, seconds * 1000);
   }
}


function store_list(){log(3,arguments,filename,store_list)
    return get_user_data().store_list 
}


function get_user_data(){log(3,arguments,filename,get_user_data)
    // reads the cookie to get a JSON block of user name, email, roles VISIBLE
    try{
      return JSON.parse(atob(get_cookie("data")))
    }catch(e){
      return {roles:[]}
    }
}


async function login(params){log(3,arguments,filename,login)
    // manage the login process

    const panel=tag("login_panel")

    if(!params){ // no parameters, just show the form

        if(panel.innerHTML===""){
            panel.style.display="block"
            panel.innerHTML=`
                <form>
                    <input placeholder="Email" name="email"><br>
                    <input placeholder="Password" name="password" type="password"><br>
                    <input type="hidden" name="mode" value="login">
                    <button id="login_button" type="button" onclick="login(form_data(this,true))">Log In</button>
                </form>        
            `
        }else{
            toggle(panel)
        }
    }else{
        // params were sent, it must be an attempt at loggin in.

        // validate data before sending to server
        if(!params.email || !params.password){
            message({
                title:"Login Failed",
                message:"Email and password are both requied",
                kind:"error",
                seconds:5    
            })
            tag("login_button").innerHTML="Login"
            return
        }


        if(!is_valid_email(params.email)){
            message({
                title:"Login Failed",
                message:"Email is not in expected format",
                kind:"error",
                seconds:5    
            })
            tag("login_button").innerHTML="Login"
            return
        }


        const response = await server_request(params)
        if(response.status==="success"){
            build_menu(authenticated_menu)
            //show_menu(authenticated_menu)
        }else{
            message({
                title:"Login Failed",
                message:"Either the email address or password was not recognized",
                kind:"error",
                seconds:5    
            })
    
            tag("login_button").innerHTML="Login"
        }
    }
}


async function logout(){log(3,arguments,filename,logout)
  erase_cookie("auth")
  erase_cookie("data")
  build_menu(unauthenticated_menu)
  navigate({fn:"show_home"})
}

async function personal_data(params){log(3,arguments,filename,personal_data)
    if(!logged_in()){show_home();return}
    console.log("at personal data", params)
    hide_menu()
    
    if(!params){ //no params sent.  Need to build the form container
        tag("canvas").innerHTML=` 
        <div class="page">
                        <h2>Modify Data</h2>
                <div id="personal-data-message" style="width:170px;padding-top:1rem;margin-bottom:1rem">
                <i class="fas fa-spinner fa-pulse"></i> Getting your data.
                </div>
                <div id="personal_data_panel"></div>
        </div>
        `
        const panel=tag("personal_data_panel")
      
        response = await server_request({  // getting the member data
            mode:"get_user_record"
        })

        if(response.status==="success"){
            tag("personal-data-message").innerHTML="Update your personal data below."
            panel.style.display="block"
            console.log("response",response)
            panel.innerHTML=`
                <form>
                    <input placeholder="First Name" name="first_name" id="1235" value="${response.data.fields.first_name || ""}"><br>
                    <input placeholder="Last Name" name="last_name" value="${response.data.fields.last_name || ""}"><br>
                    <input placeholder="Email Address" name="email" value="${response.data.fields.email || ""}"><br>
                    <input placeholder="Phone Number" name="phone" value="${response.data.fields.phone || ""}"><br>
                    Other employes can see ...<br>
                    <select name="visibility">
                        <option value="show-all" ${response.data.fields.visibility==="show-all" ?"selected":""}>my phone and email</option>
                        <option value="email-only" ${response.data.fields.visibility==="email-only" ?"selected":""}>my email address only</option>
                        <option value="phone-only" ${response.data.fields.visibility==="phone-only" ?"selected":""}>my phone number only</option>
                        <option value="hide-all" ${response.data.fields.visibility==="hide-all" ?"selected":""}>no contact details</option>
                    </select><br><br>
                    <input type="hidden" name="mode" value="update_user_record">
                    <button id="submit_button" type="button" onclick="personal_data(form_data(this,true))">Update</button>
                </form>   
            `    

            tag("1235").focus()
        }else{
            message({
                title:"Server Failure",
                message:"Error getting personal data: " + response.message,
                kind:"error",
                seconds:5    
            })
        }
        
    }else if(params.button){
        if(params.button==='Update'){
            response = await server_request(params)
            tag("submit_button").innerHTML="Update"

            if(response.status==="success"){
                message({
                    title:"Success",
                    message:"Data Updated",
                    seconds:3
                })
            }else{
                message({
                    title:"Server Failure",
                    message:`Failed to update. ${response.message}`,
                    kind:"error",
                    seconds:5    
                })
            }
        }
    }
}    

async function create_account(params){log(3,arguments,filename,create_account)
    if(!user_has_role(["owner","manager","administrator"])){show_home();return}
    const panel=tag("create_account_panel")
    hide_menu()
    
    if(!params){ 
        tag("canvas").innerHTML=` 
        <div class="page">
            <h2>New Employee</h2>
            <div id="create-account-message" style="width:170px;padding-top:1rem;margin-bottom:1rem">
            Enter the new employee information here.  If present, the employee can enter a password of thier choosing; otherwise, make one up and they can reset it.
            </div>
            <div id="create_account_panel"></div>
        </div>
        `
        create_account({action:"show-form"})
    }else if(params.button){
        if(params.button==='Create Account'){
            response = await server_request(params)
            console.log("response in submit_account", response)
            tag("create-account-message").innerHTML="Check your email for a code and enter it here."
            if(response.status==="success"){
                panel.innerHTML=`
                ${params.first_name}
                ${params.last_name}<br>
                ${params.email}<br>
                <form>
                <input placeholder="Code From Email" name="code"><br>
                <input type="hidden" name="mode" value="verify_account">
                <input type="hidden" name="email" value="${params.email}">
                <button type="button" onclick="create_account(form_data(this,true))">Verify Account</button>
                </form>   
            `    
                

            }else{
            tag("create-account-message").innerHTML="Account creation failed. " + response.message
            tag("create_account_button").innerHTML="Create Account"    
            }
        }else if (params.button==='Verify Account'){
            response = await server_request(params)
            if(response.status==="success"){
                message({
                    title:"Account Verified",
                    message:"You are now logged in.",
                    seconds:3
                })                
                // might make a call back to server at this point
                build_menu(authenticated_menu)
                show_home()
                
            }else{
                message({
                    title:"Confirmation Failure",
                    message:`Failed to confirm account: ${response.message}`,
                    kind:"error",
                    seconds:5    
                })                
            }
        }else{
            console.log("invalid process:", params.button)
        }

    }else if(params.action==="show-form"){    
        if(panel.innerHTML===""){
            panel.style.display="block"
            const html=[`
            <form>
                <input placeholder="First Name" name="first_name" id="1234"><br>
                <input placeholder="Last Name" name="last_name"><br>
                <input placeholder="Email Address" name="email"><br>
                <input placeholder="Phone Number" name="phone"><br>
                <input placeholder="Password" name="password" type="password"><br>
                Store: <select name="store">
                <option value="" selected></option>
                `]

                params = {mode:'get_store_list'}
                response = await server_request(params)
                if(response.status!=="success"){
                    message({
                        title:"Error",
                        message:"Unable to get store list.",
                        kind:"error",
                        seconds:8
                    })
                }                
    

                for(const [key,val] of Object.entries(response.store_list)){
                        html.push(`<option value="${val}">${key}</option>`)
                }
            html.push(`</select><br><br>
                    Other employees can see ...<br>
                    <select name="visibility">
                        <option value="show-all" selected>my phone and email</option>
                        <option value="email-only">my email address only</option>
                        <option value="phone-only">my phone number only</option>
                        <option value="hide-all">no contact details</option>
                    </select><br><br>
                    <input type="hidden" name="mode" value="create">
                    <input type="hidden" name="confirm" value="${location.href.split("?")[0]}">
                    <button id="create_account_button" type="button" onclick="create_account(form_data(this,true))">Create Account</button>
                </form>   
            `)
            panel.innerHTML=html.join("")
            tag("1234").focus()
        }else{
            toggle(panel)
        }
}
}    

async function confirm_account(params){log(3,arguments,filename,confirm_account)
    // called by the link emailed to the user
    
    response = await server_request({
        mode:"verify_account",
        email:params.email,
        code:params.code
    })
    if(response.status==="success"){
        message({
            title:"Account Verified",
            message:"You are now logged in.",
            seconds:3
        })          
        build_menu(authenticated_menu)
        navigate({fn:show_home})
    }else{
        message({
            title:"Confirmation Failure",
            message:`Failed to confirm account: ${response.message}`,
            kind:"error",
            seconds:5    
        }) 
    }
}


async function change_password(params){log(3,arguments,filename,change_password)
    if(!logged_in()){show_home();return}
    const panel=tag("password_panel")

    if(!params){// no parameters sent, just build the form
        if(panel.innerHTML===""){
            panel.style.display="block"
            panel.innerHTML=`
                <form>
                    <input placeholder="Old Password" name="old_password" type="password"><br>
                    <input placeholder="New Password" name="new_password" type="password"><br>
                    <input type="hidden" name="mode" value="change_password">
                    <button id="pw_button" type="button" onclick="change_password(form_data(this,true))">Change Password</button>
                </form>        
            `
        }else{
            toggle(panel)
        }

    }else if(params){ // parameters sent, must be trying to change

        // validate data before sending to server
        if(!params.old_password || !params.new_password){
            message({
                title:"Login Failed",
                message:"You must provide both the old password and the new password.",
                kind:"error",
                seconds:5    
            })
            tag("pw_button").innerHTML="Change Password"
            return
        }

        response = await server_request(params)
        tag("pw_button").innerHTML="Change Password"
        if(response.status==="success"){
            message({
                title:"Success",
                message:"Password Reset",
                seconds:3
            })            
        }else{
            message({
                title:"Failure",
                message:`Password not reset. ${response.message}`,
                kind:"error",
                seconds:5    
            })            
        }
    }    
}
  

async function update_user(params,panel){log(3,arguments,filename,update_user)
    if(!user_has_role(["owner","manager","administrator"])){show_home();return}
    if(!panel){panel=tag("update_user")}
    if(typeof params === "string"){
        // passing in just an email address to be updated
        const params={
            email:params,
            button:"Update User",
            mode:"update_user"        
        }
    }
    
    if(!params){
        if(panel.innerHTML===""){
            panel.style.display="block"
            panel.innerHTML=`
                <form>
                    <input placeholder="Email Address of User" name="email"><br>
                    <input type="hidden" name="mode" value="update_user">
                    <button id="update_user_button" type="button" onclick="update_user(form_data(this,true))">Update User</button>
                </form>        
            `
        }else{
            toggle(panel)
        }
    }else{

        // validate data before sending to server
        if(!is_valid_email(params.email)){
            message({
                title:"Email Error",
                message:"You must provide the email of a user.",
                kind:"error",
                seconds:5    
            })
            tag("update_user_button").innerHTML="Update User"
            return
        }


        response = await server_request(params)
        if(tag("update_user_button")){
            tag("update_user_button").innerHTML="Update User"
        }

        if(response.status==="success"){
            message({
                title:"Success",
                message:"User updated.",
                seconds:3
            })            
        }else{
            message({
                title:"User not updated",
                message:response.message,
                kind:"error",
                seconds:5    
            })
        }

    }    
}

async function recover_password(params){log(3,arguments,filename,recover_password)
    console.log("recover_password", params)
    const panel=tag("recover")
    if(!params){
        if(panel.innerHTML===""){
            panel.style.display="block"
            panel.innerHTML=`
                <form>
                    <input placeholder="Email Address" name="email"><br>
                    <input type="hidden" name="mode" value="initiate_password_reset">
                    <input type="hidden" name="reset_link" value="${location.href.split("?")[0]}">
                    <button id="recover_password_button" type="button" onclick="recover_password(form_data(this,true))">Request Reset</button>
                    </form>        
            `
        }else{
            toggle(panel)
        }
    }else if(params.code && !params.mode){
        // user followed an email link to get here, show the from
        build_menu(unauthenticated_menu)
        show_menu()
        const panel=tag("recover")
        panel.style.display="block"
        panel.innerHTML=`
        <form>
        <input placeholder="New Password" name="password" type="password"><br>
        <input type="hidden" name="email" value="${params.email}">
        <input type="hidden" name="code" value="${params.code}">
        <input type="hidden" name="mode" value="reset_password">
        <button id="recover_password_button" type="button" onclick="recover_password(form_data(this,true))">Reset Password</button>
        </form>        
    `
    }else if(params.code ){
        //user is submitting  a code and a new password
        
        response = await server_request(params)        
        if(panel){
            panel.innerHTML=''
            panel.style.display="none" 
        }

        if(response.status==="success"){
            message({
                title:"Success",
                message:"Rassword reset. You are now logged in",
                seconds:3
            })
            build_menu(authenticated_menu)
            show_home()
        }else{
            message({
                title:"Password not reset",
                message:response.message,
                kind:"error",
                seconds:5    
            })            
        }            

    }else if(params.mode==="initiate_password_reset"){
        // user is  initiating a request
        response = await server_request(params)
        
        if(response.status==="success"){
            message({
                title:"Email Sent",
                message:"An email was sent with an authorization code.",
                seconds:5
            })
            panel.innerHTML=`
            <form>
            <input placeholder="Code from Email" name="code"><br>
            <input placeholder="New Password" name="password" type="password"><br>
            <input type="hidden" name="email" value="${params.email}">
            <input type="hidden" name="mode" value="reset_password">
            <button id="recover_password_button" type="button" onclick="recover_password(form_data(this,true))">Reset Password</button>
            </form>        
        `
        }else{
            tag("recover_password_button").innerHTML="Request Reset"
            message({
                title:"Server Failure",
                message:`Email not recognized`,
                kind:"error",
                seconds:5    
            })
            
        }
    }    
}

function message(parameters){log(3,arguments,filename,message)
    //returns a reference to the message created
    // Example parameters{
    //     message:"Password must contain at least one Capital letter",
    //     title:"User Error",
    //     kind:"error",
    //     seconds:4
    // }
    let params
    if(typeof parameters==="string"){
        params={
            message:parameters
        }
    }else{
        params=parameters
    }

    if(!params.title){params.title="Message"}
    if(!params.seconds){params.seconds=0}

    
    let message_class="msg-head"
    if(params.kind==="error"){
        message_class += " error"
        if(params.title==="Message"){
            params.title="Error"
        }
    }else if(params.kind==="info"){
        message_class += " info"
    }
    const msg=document.createElement("div")
    msg.className="message"
    msg.innerHTML=`
    <div class="${message_class}">
      ${params.title}
      <div class="msg-ctrl">
      <i class="fas fa-times" onclick="this.parentElement.parentElement.parentElement.remove()" style="cursor: pointer;"></i>
      </div>
    </div>
    <div class="msg-body">
    ${params.message}
    </div>`
    if(params.seconds>0){
      setTimeout(function(){msg.remove()},params.seconds*1000)
    }
    tag("message-center").appendChild(msg)
    return msg

}

function logged_in(){log(2,arguments,filename,logged_in)
    return !!get_cookie("auth")
}

function user_has_role(array_of_permitted_roles){log(3,arguments,filename,user_has_role)
    //returns true if the logged in user has at least one of the roles specified
    // if no roles specified, returns true if the user is logged in
    if(array_of_permitted_roles){
        if(typeof array_of_permitted_roles==="string"){
            // intersect requires arrays and the caller sent a string, make it an array
            return intersect(get_user_data().roles,[array_of_permitted_roles]).length>0
        }else{
            return intersect(get_user_data().roles,array_of_permitted_roles).length>0
        }   
    }else{
        // no roles specified, just need to be logged in
        return !!get_cookie("auth")
    }
}




          ///////////////////////////////////////////////////////
         //                                                   //
        //             Functions for Logging                 //
       //                                                   //   
      ///////////////////////////////////////////////////////


    
    function log(...args){
        if(args.length===0){return} 

        const level=args.shift()
        if(isNaN(level) || level<1){return}// return if loglevel is not in valid range for output

        if(args.length===0){return}   // if all that was passed in is a loglevel, there is nothing to log

        if( level < log_level){return} // the level of this log call is below the current threshold for display.  get out

        if(args.length===3 && typeof args[0] === "object" && args[1].slice(-3).toLowerCase()===".js" && typeof args[2]==="function"){
            // this block is for logging function calls
            // an example call to invoke this 
            // log(2,arguments,filename)
    
            const func=args[2]
            let file_clause = ""
            if(args[1]){
                if (supress_logs_from_files.includes(args[1])){
                    return
                }
                file_clause = " from the file named [" + args[1] + "]"
            }

            const css='color:green;background:#eee;padding:5px'
            const param_names = paramNames(func)
            const param_vals = args[0]
            let max_name_size=0
            for(const name of param_names){
                if(name.length>max_name_size){
                    max_name_size=name.length
                }
            }
            if(param_names.length===0){
                file_clause +=  " without arguments                           "
            }else{
                file_clause +=  " with the following arguments:                           "
            }
            console.log ("%c" + func.name + "         was called" + file_clause ,css)
            for(let p=0;p<param_names.length;p++){
                let val
        
                if(param_vals.length > p){
                    val= param_vals[p]
                }
                console.log("%c" + param_names[p].padStart(max_name_size+2), css, val)
                
            }
        }else{
            console.log(...args)
        }
    }
    
    function paramNames(func) {  // returns an array of argument names if passed a function
        return (func + '')
          .replace(/[/][/].*$/mg,'') // strip single-line comments
          .replace(/\s+/g, '') // strip white space
          .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments  
          .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters  
          .replace(/=[^,]+/g, '') // strip any ES6 defaults  
          .split(',').filter(Boolean); // split & filter [""]
    }  
