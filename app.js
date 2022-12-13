
//gas project /apps/brookers/system 
//This global variable is set to contain the information needed to make a request of the Google App Script server.
const gas_end_point = 'https://script.google.com/macros/s/'+gas_deployment_id+'/exec'

//This global variable defines the first two navigation items in the menu. In this app there are only two main navigation items "Home" and "Locations". These two menu items are visible regardless of login status.  
const nav_menu=[]

//This global variable sets the menu items for an unautheticated user.  
const unauthenticated_menu=[
    //The unautheticated user is presented with the "Home" and "Locations" (defined in the nav_menu global variable).
    {menu:nav_menu},
    //this empty object inserts a horizontal line in the navigation menu panel
    {},
    //The unauthenticated user is also presented with the "Login" and "Recover password" menu options.
    {label:"Login",function:"login()",home:"Login",panel:"login_panel"},
    {label:"Recover Password",function:"recover_password()",panel:"recover"}, 
]

//This global variable sets the menu items for an autheticated user.  
const authenticated_menu=[
    //The autheticated user is presented with the "Home" and "Locations" (defined in the nav_menu global variable).
    {menu:nav_menu},
    //this empty object inserts a horizontal line in the navigation menu panel
    {},
    //The authenticated user is also presented with additional menu options.
    //The first item loads the user's name (get_user_name) which is the label for a top-level menu which is built for the user functions
    {label:get_user_name,id:"user-menu", menu:[
        //the user functions include the ability to change their password and edit their personal data
        {label:"Change Password",function:"change_password()",panel: "password_panel"},
        {label:"Personal Data",function:"navigate({fn:'personal_data'})"},
    ]},

    //This menu item allows the user to logout
    {label:"Logout",function:"logout()", home:"Logout"},

    //This menu item allows the user to add additional users. Note the "roles" property of the object. Only users with the role of "manager", "owner", or "administrator" will see this menu item. User roles are not heirachical. All user types you wish to see a menu item must be listed in the elements of the array.
    {label:"Add Employee",function:"navigate({fn:'create_account'})", roles:["manager","owner","administrator"]}, 



    //the remaining menu items are added
    {label:"View Progress",home:"Inventory",function:"navigate({fn:'show_student_completion'})", roles:["owner","administrator"]},
    {label:"Mark Off",function:"navigate({fn:'markoff_req'})"},

    {label:"Employee List",function:"navigate({fn:'employee_list'})"},
    {label:"Admin Tools",id:"menu2", roles:["manager","owner","administrator"], menu:[
        {label:"Update User",function:"update_user()",panel:"update_user"},
    ]},
]

filename="app.js"// used to control logging

function show_home(){
    tag("canvas").innerHTML=""
    //builds the menu for the home screen
    const menu=[]
    //current_menu is a lobal variable that is built based on the set of menu items defined for users and their roles. 
    for(item of current_menu){
        if(item.home){
            menu.push(`<a onClick="${item.function}">${item.home}</a>`)
        }
    }
    //The navigation menu is hidden (the three parallel lines are show) when the homepage is rendered.
    hide_menu()
}

function get_user_name(){log(2,arguments,filename,get_user_name)
    //returns the user's first and last name. Used when building the navigation menu to be the label for the menu items related to maintaining the user. The get_user_data function reads the user information from the data cookie that is created when the user logs in.
    data=get_user_data()
    return data.first_name + " " + data.last_name
}

async function markoff_req(store){
    hide_menu()

   tag("canvas").innerHTML=` 
    <div class="page">
        <div id="inventory-title" style="text-align:center"><h2>Mark Off Requirement</h2></div>
        <div id="inventory-message" style="width:100%"></div>
        <div id="inventory_panel"  style="width:100%">
        </div>
    `
    const Completion=await server_request({
        mode:"get_user_completion",

    })

    const Requirements=await server_request({
        mode:"get_requirements",
        ReqID: "all",
    })

    console.log(Completion)
    console.log(Requirements)

    let joined_tables = []
    for(const Completion_record of Completion.records){
        for(const Requirement_record of Requirements.records){
            if(Completion_record.fields.UserReqID == Requirement_record.fields.ReqID){
                joined_tables.push({
                    UserReqID:Completion_record.fields.UserReqID, 
                    Category:Requirement_record.fields.ReqCategory, 
                    Description:Requirement_record.fields.ReqWriting,
                    ObservedCompetency:Completion_record.fields.ObservedCompetency,
                    TimeCompleted:Completion_record.fields.TimeCompleted,
                    PreceptorName:Completion_record.fields.PreceptorName})
                break
            }
        }
    }

    let categories = {}

    for(const record of joined_tables){
        if(!(record.Category in categories)){
            categories[record.Category] = [`
            <h1>${record.Category}</h1>
            <table class="completion-table">
            <tr>
            <th class="sticky">Description</th>
            <th class="sticky">Completed</th>
            </tr>
            `]
        }
        let html = ""
        html+=`<td >${record.Description}</td>`
        if(typeof record.ObservedCompetency == "string"){
            html += '<td><input type="checkbox" </td>'
            } else {
                html+='<td><input type="checkbox" </td>'
            }


        html+='</tr>'
        categories[record.Category].push(html)

    }

    Object.values(categories).forEach((item) =>
    tag("inventory_panel").innerHTML += item.join('')
    )
}

async function show_student_completion(){
    hide_menu()
    tag("canvas").innerHTML=` 
    <div class="page">
        <div id="inventory-title" style="text-align:center"><h2>PA Program Progress</h2></div>
        <div id="inventory_panel"  style="width:100%"></div>
    `
   //Get the UserReq table from Airtable
    const Completion=await server_request({
        mode:"get_user_completion",
        UserID:12345678,
    })

    //Get the Requirements tabel from Airtable
    const Requirements=await server_request({
        mode:"get_requirements",
        ReqID:"all"
    })

    console.log(Completion)
    console.log(Requirements)

    //Combine the Completion and Requirements table into joined_tables
    let joined_tables = []
    for(const Completion_record of Completion.records){
        for(const Requirement_record of Requirements.records){
            if(Completion_record.fields.UserReqID == Requirement_record.fields.ReqID){
                joined_tables.push({
                    UserReqID:Completion_record.fields.UserReqID, 
                    Category:Requirement_record.fields.ReqCategory, 
                    Description:Requirement_record.fields.ReqWriting,
                    ObservedCompetency:Completion_record.fields.ObservedCompetency,
                    TimeCompleted:Completion_record.fields.TimeCompleted,
                    PreceptorName:Completion_record.fields.PreceptorName})
                break
            }
        }
    }

    let categories = {}

    //Create the html table rows and sort into categories
    for(const record of joined_tables){
        if(!(record.Category in categories)){
            categories[record.Category] = [`
            <h1>${record.Category}</h1>
            <table class="completion-table">
            <tr>
            <th class="sticky">Description</th>
            <th class="sticky">Observed Competency</th>
            <th class="sticky">Time Completed</th>
            <th class="sticky">Preceptor Name</th>
            </tr>
            `]
        }
        //TO DO: Figure out a better way of doing this
        //Each table row can be clicked on to see the details and request to have it signed off
        let html = `<tr onClick="show_requirement(${[record.UserReqID]})">`
        html+=`<td>${record.Description}</td>`
        if(typeof record.ObservedCompetency == "string"){
            html+=`<td>${record.ObservedCompetency}</td>`
            } else {
                html+='<td> </td>'
            }

        if(typeof record.TimeCompleted == "string"){
            date = new Date(record.TimeCompleted)
            html+=`<td>${date.toLocaleString()}</td>`
            } else {
                html+='<td> </td>'
            }

        if(typeof record.PreceptorName == "string"){
            html+=`<td>${record.PreceptorName}</td>`
            } else {
                html+='<td> </td>'
            }
        html+='</tr>'
        categories[record.Category].push(html)

    }

    //Combine all the html and put in the invetory panel
    Object.values(categories).forEach((item) =>
    tag("inventory_panel").innerHTML += item.join('')
    )
    tag("inventory_panel").innerHTML += html
}

function add_buttons(row,col){log(2,arguments,filename,add_buttons)
    //this function is used to create the input buttons for recording the inventory observations. Notice that we only use the options for case 3. We might use the other options in the future.
    const box = tag(row + "|" + col.replace(/\s/g,"_"))    
    const container = box.parentElement
    switch(window.cols[col]){
        case 3:
            box.style.display="none"
            container.appendChild(get_div_button(box,"20%",0,"0"))
            container.appendChild(get_div_button(box,"20%",.25,"&#188;"))
            container.appendChild(get_div_button(box,"20%",.5,"&#189;"))
            container.appendChild(get_div_button(box,"20%",.75,"&#190;"))
            container.appendChild(get_div_button(box,"20%",1,"1"))
            break;
        case 2:
            box.style.width="30px"
            container.prepend(get_div_button(box,"15%",2))
            container.prepend(get_div_button(box,"15%",1))
            container.prepend(get_div_button(box,"15%",0))
            break
        case 1:
            box.style.width="30px"
            container.prepend(get_div_button(box,"15%",4))
            container.prepend(get_div_button(box,"15%",3))
            container.prepend(get_div_button(box,"15%",2))
            container.prepend(get_div_button(box,"15%",1))
            container.prepend(get_div_button(box,"15%",0))
            break
        }
}

function get_div_button(box,width,value,label){log(2,arguments,filename,get_div_button)
    //This sets the color of the buttons to grey when they are selected to visually show that the value has been entered for that item.
    if(label===undefined)(label=value)
    const div=document.createElement('div')
    div.addEventListener("click",async function(event){
        box.value=value
        if(await update_observation(box)){
            for(const div of getAllSiblings(this)){
                if(div.tagName==="DIV"){
                    div.style.backgroundColor="transparent"
                    div.style.color="lightGray"
                    console.log(div)
                }
            }
            this.style.backgroundColor="lightGray"
            this.style.color="black"
        }
    })
    div.style.height="100%"
    div.style.display="inline-block"
    div.style.width=width
    div.style.textAlign="center"
    div.style.borderRadius="50%"
    div.style.color="lightgrey"
    div.innerHTML=label
    
    return div
}


function move_down(source){log(3,arguments,filename,move_down)
    // aids in navigation. selects the next cell below when a value is updated
    const ids=source.id.split("|")
    ids[1]=ids[1].replace(/_/g," ")
    
    let next_flavor=window.rows[window.rows[ids[0]]+1]
    let next_container=ids[1]
    if(!next_flavor){
        next_flavor=window.rows[1]
        next_container = window.cols[window.cols[next_container]+1]
        if(!next_container){
            next_container=window.cols[1]
        }
    }
    tag(next_flavor + "|" + next_container.replace(/\s/g,"_")).focus()
}

async function employee_list(){log(4,arguments,filename,employee_list)
    //this function displays an employee list. If the user role allows, the option to update the user record in Google App Script is presented
    //Note: user information is stored in Airtable. However, to avoid the need to repeatedly access Airtable to retrieve user information, a record is stored in Google App Script. This record must be updated when changes are made to user information in Airtable, thus the need for user information to be updated.
    if(!logged_in()){show_home();return}//in case followed a link after logging out
    hide_menu()
    //Build the HTML placeholders for the employee data.
    tag("canvas").innerHTML=` 
    <div class="page">
        <h2>Employee List</h2>
        <div id="member-list-message" style="padding-top:1rem;margin-bottom:1rem">
        Employee information is private and should not be shared.
        </div>
        <div id="employee_list_panel">
        <i class="fas fa-spinner fa-pulse"></i>
        </div>
    </div>
    `
    
    //retrieve the employee data using the local server_request function to request the Google App Script function "employee_list" retrieve the employee data.
    const response=await server_request({
        mode:"employee_list",
        filter:""
    })

    //build the standard headers for the employee table
    const labels={
        first_name:"First Name",
        last_name:"Last Name",
        email:"Email",
        phone:"Phone",
    }

    //determine if the user has a role that allows for employee updates.
    const is_admin=intersect(get_user_data().roles, ["administrator","owner","manager"]).length>0

    if(response.status==="success"){
        const html=['<table style="background-color:white"><tr>']
        //add the standard headers to the table
        for(const field of response.fields){
            html.push("<th>")
            html.push(labels[field])
            html.push("</th>")
        }
        //If the role is sufficient to perform employee updates, add the header "Action"
        if(is_admin){html.push("<th>Action</th>")}
        html.push("</tr>")

        //process through the employee records that were returned and add them to the table.
        for(const record of response.records){
            html.push("<tr>")
            console.log(record)
            for(const field of response.fields){
                if(record.fields[field]==="withheld"){
                  html.push('<td style="color:lightgray">')
                }else{
                  html.push("<td>")
                }
                html.push(record.fields[field])
                html.push("</td>")
            }
            //If the user is able to perform employee updates, add a button that allows them update employees
            if(is_admin){
                html.push("<td>")
                    html.push(`<a class="tools" onclick="update_user({email:'${record.fields.email}', button:'Update User', mode:'update_user'},tag('member-list-message'))">Update</a>`)
                html.push("</td>")
            }
            html.push("</tr>")
        }
        html.push("</table>")
    
        tag("employee_list_panel").innerHTML=html.join("")
    
    }else{
        tag("employee_list_panel").innerHTML="Unable to get member list: " + response.message + "."
    }    

}

async function show_requirement(user_req_ID){
    //Get the user_req with the specified user_req_ID
    const user_req = await server_request({
        mode: "get_user_req",
        UserReqID: user_req_ID,
    })
    console.log(user_req)
    //Get the requirement that corresponds to the user_req
    const requirement = await server_request({
        mode: "get_requirements",
        ReqID: user_req.records[0].fields.ReqID,
    })
    console.log(requirement)
    //Check if the requirement is complete, change the value of req_status accordingly
    let req_status = ""
    if(typeof user_req.records[0].fields.ObservedCompetency == "string"){
        date = new Date(user_req.records[0].fields.TimeCompleted)
        date = date.toLocaleString()
        req_status = `Completed on ${date}`
    } else{
        req_status= "Incomplete"
    }

    //Get physicians to choose from
    const physicians = await server_request({
        mode: "get_users",
        filter: "Role='Physician'"
    })
    console.log(physicians)
    //Create the drop down menu
    let dropdown = '<select id="select_physician">'
    for(const physician of physicians.records){
        dropdown += `<option value="${physician.fields.UVUID}">${physician.fields.FirstName} ${physician.fields.LastName}</option>`
    }
    dropdown+= '</select>'

    //Create the html and put it in the canvas
    html = `
    <h1>Requirement Details</h1>
    <h3>Category: ${requirement.records[0].fields.ReqCategory} </h3>
    <h3>Description: </h3>
    <h3>${requirement.records[0].fields.ReqWriting}</h3>
    <h3> ${req_status}</h3>
    <button  onclick="request_signoff(${user_req_ID})">Request Signoff</Button>
    ${dropdown}
    `
    tag("canvas").innerHTML = html
}

async function request_signoff(user_req_ID){
    //The parameters for this function are the user_req_ID that needs to be signed of on
    const response = await server_request({
        mode: "request_signoff",
        UserReqID: user_req_ID,
        PreceptorID: parseInt(tag("select_physician").value)
    })
    if(response.status == "success"){
        tag("canvas").innerHTML = "<h2>Signoff Request has been sent</h2>"
    }
}
