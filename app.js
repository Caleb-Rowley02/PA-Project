
//gas project /apps/brookers/system 
//This global variable is set to contain the information needed to make a request of the Google App Script server.
const gas_end_point = 'https://script.google.com/macros/s/'+gas_deployment_id+'/exec'

//This global variable defines the first two navigation items in the menu. In this app there are only two main navigation items "Home" and "Locations". These two menu items are visible regardless of login status.  
const nav_menu=[
    //Note that a menu item is added by inserting an object for that menu item. The 'label' is the text that the user sees for that menu option. The function is the javascript function invoked when selecting that option. Here we insert the "home" and "locations" menu items. Both initiate a call to the navigate function which loads the appropriate page. The navigate function is used to help ensure smooth navigation. It allows the user to use the back botton in their browser when navigating between pages on the site (without navigating out ot the site). The navigate can accept parameters that can be passed to the function called by navigate.
    {label:"Home",function:"navigate({fn:'show_home'})"},
    {label:"Locations",function:"navigate({fn:'show_locations'})"},
    
]

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

    //This menu item adds the menu item for updating an inventory count. Notice how a parameter is passed to the "ice_cream_inventory" function
    {label:"Enter Ice Cream Inventory",home:"Inventory",function:"navigate({fn:'record_inventory'})"},

    //the remaining menu items are added
    {label:"Ice Cream Inventory Summary",home:"Inventory",function:"navigate({fn:'show_inventory_summary'})", roles:["owner","administrator"]},

    {label:"Employee List",function:"navigate({fn:'employee_list'})"},
    {label:"Admin Tools",id:"menu2", roles:["manager","owner","administrator"], menu:[
        {label:"Update User",function:"update_user()",panel:"update_user"},
    ]},

]

filename="app.js"// used to control logging

function show_home(){log(4,arguments,filename,show_home)
    
    //builds the menu for the home screen
    const menu=[]
    //current_menu is a global variable that is built based on the set of menu items defined for users and their roles. 
    for(item of current_menu){
        if(item.home){
            menu.push(`<a onClick="${item.function}">${item.home}</a>`)
        }
    }

    //the main page is rendered with the Brooker's Ice cream logo. 

    tag("canvas").innerHTML=` 
    <div class="center-screen">
    
    <p><img height="${window.innerHeight * .6}" src="images/brookers-logo.png"></p>
    <div style="text-align:center"></div>
    
    
    </div>
    `

    //The navigation menu is hidden (the three parallel lines are show) when the homepage is rendered.
    hide_menu()
}

function get_user_name(){log(2,arguments,filename,get_user_name)
    //returns the user's first and last name. Used when building the navigation menu to be the label for the menu items related to maintaining the user. The get_user_data function reads the user information from the data cookie that is created when the user logs in.
    data=get_user_data()
    return data.first_name + " " + data.last_name
}


async function show_tasks(store){
    // To be built during workshop
}


async function record_task(button){
    // To be built during workshop
}


async function show_locations(){log(4,arguments,filename,show_locations)
    // message({
    //     message:"Once programmed, this feature will show the details about store locations",
    //     title:"Comming Soon...",
    //     kind:"",
    //     seconds:10
    // })


    tag("canvas").innerHTML=` 
    <div class="page">
        <h2>Store List</h2>
        <div id="store_list_panel">
        <i class="fas fa-spinner fa-pulse"></i>
        </div>
    </div>
    `
    
    //retrieve the store data using the local server_request function to request the Google App Script function "get_stores" retrieve the employee data.
    const response=await server_request({
        mode:"get_stores"
    })

    //build the headers for the stores table
    const fields=[
        {name:"address",label:"Address"},
        {name:"city",label:"City"},
        {name:"state",label:"State"},
        {name:"phone",label:"Phone"},
    ]


    // a status of success indicates that the server request ran without error
    if(response.status==="success"){
        // html is an array that we'll use to build the HTML to render
        const html=['<table style="background-color:white"><tr>']
        //add the headers to the table
        for(const field of fields){
            html.push("<th>")
            html.push(field.label)
            html.push("</th>")
        }

        //process through the employee records that were returned and add them to the table.
        for(const record of response.records){
            html.push("<tr>")
            console.log(record)
            for(const field of fields){
                html.push("<td>")
                html.push(record.fields[field.name])
                html.push("</td>")
            }

            html.push("</tr>")
        }
        html.push("</table>")
        console.log(html) 
        tag("store_list_panel").innerHTML=html.join("")
    
    }else{
        tag("store_list_panel").innerHTML="Unable to get store list: " + response.message + "."
    }    








    console.log(response)
    hide_menu()
}


async function record_inventory(params){log(4,arguments,filename,record_inventory)
    console.log('in record_inventory')

    if(!logged_in()){show_home();return}//in case followed a link after logging out. This prevents the user from using this feature when they are not authenticated.

    //First we hide the menu
    hide_menu()

    //This function is set up recursively to build the page for working with inventory. The first time the function is called, the HTML shell is created for displaying either the inventory form for recording the count or the inventory report. Note that this will only be built if there is a "style" property set when the function is called. Once the shell is created, the function is called again to either built the form for recording an inventory count or create the summary report.
    if(!params){
        //building the HTML shell
        tag("canvas").innerHTML=` 
            <div class="page">
                <div id="inventory-title" style="text-align:center"><h2>Ice Cream Inventory</h2></div>
                <div id="inventory-message" style="width:100%"></div>
                <div id="inventory_panel"  style="width:100%">
                </div>
            </div>  
        `
        //loading user data. Any user can record an inventory count, so we don't need to check their role at this point. If a user is associated with more than one store and they wish to record an inventory count, they will be prompted to select the store they want to work with.

        const user_data = get_user_data()
        console.log ("user_data",user_data)
        if(user_data.store.length===1){
            //If the user is associated with exactly 1 store, we call the get_inventory_list function again to populate the rest of the page with the data for that store. 
            tag("inventory-message").innerHTML='<i class="fas fa-spinner fa-pulse"></i>'//this element is used to add a visual element (spinning wheel) to signify that the site is processing.
            //we call the get_inventory_list function (mode) filtered to show only "Ice Cream" (filter) - note that there are other inventory items - in the store associated with this user (store).
            record_inventory({
                mode:"get_inventory_data",
                filter:"list='Ice Cream'",
                store:user_data.store[0]
            })
        }else{
            //We get here if the user is associated with more than 1 store. We build a form to have the user select the store they wish to work with.
            const html=['<form>Store: <select name="store">']
            for(store of user_data.store){
                html.push(`<option value="${store}">${store_list()[store]}</option>`)
            }
            //When the user selects the store using the form, the "get_inventory_list" function is invoked on the submission of the form to populate the rest of this page with the data for that store
            html.push(`</select>
                        <button type="button" id="choose_store_button" onclick="record_inventory(form_data(this,true))">Submit</button>
                        <input type="hidden" name="mode" value="get_inventory_data">
                        <input type="hidden" name="filter" value="list='Ice Cream'">
                        </form>`)
            tag("inventory_panel").innerHTML=html.join("")
        }

    }else{    
        //Notice that the first time through the store property is undefined and is set when the user data is loaded. Therefore this code will only process the second time through once the store property is set. During this pass, we determine whether to display the report of the last recorded inventory or display the form for recording a new inventory count.
        console.log("at ice_cream_inventory params=store")
        //we use a call to the "server_request" function to use Google App Script to retrieve the data needed to processs the form or the report
        
        const response=await server_request(params)
        tag("inventory-message").innerHTML=''




        if(response.status==="success"){//If the data is retrieved successfully, we proceed.
            
            //this is generating the form for updating inventory counts in an individual store
            // keep track of navigation
            window.rows={}
            window.cols={}
            console.log("response", response)
            // build the HTML header for the page identifying the store for which the counts will be recorded
            tag("inventory-title").innerHTML=`<h2>${store_list()[params.store]} Ice Cream Inventory</h2>`
            const html=["Fill in every row in this section."]
            //build the table for the form used to record the counts.
            const header=[`
            <table class="inventory-table">
                <tr>
                <th class="sticky" onclick="show_elements(['col-1','col-2','col-3'])">Flavor</th>
                `]
            let p=1 // map store ids to column numbers.  only needed for this loop then can be reused
            
            //add table headers for the "containers" (freezers) where inventory will be counted. Note that only the "Vineyard" location has a "Hardening Cabinet"
            for(container of response.list.records[0].fields.container){
                window.cols[p]=container
                window.cols[container]=p++
                let cont=container
                console.log("container",container)
                header.push(`<th onclick="hide_elements('col-${window.cols[container]}')" class="sticky col-${window.cols[container]}" >${cont}</th>`)
            }     
            header.push('<th class="sticky">Total</th></tr>')
            html.push(header.join(""))
            irregular=[]// ice cream not in regular category

            p=1// for keeping track of navigating rows.  can be reused after this loop
            for(record of response.list.records){
                // object to allow the navigation from row to row
                window.rows[p]=record.id
                window.rows[record.id]=p++

                //build the rest of the table for all of the regular ice cream items
                let target=html
                if(record.fields.category!=="Regular"){
                    target=irregular
                }
                //add a row for each flavor (record.field.name)
                target.push("<tr>")
                target.push(`<th>${record.fields.name}</th>`)
                //build a text input in each cell. Use the combination of the flavor and container ids as the identifier of the input so that we can use it to update the correct record. When a value in the input is change (onchange), the update_observation function is called and passed the value and information needed (store, flavor, and container) to add the observation to the database. update_observation is a function in Amazon App Script.
                for(container of record.fields.container){
                    target.push(`<td class="active col-${window.cols[container]}"><input id="${record.id}|${container.replace(/\s/g,"_")}" data-store="${params.store}" data-item_id="${record.id}" data-container="${container}" type="text" onchange="update_observation(this)"></td>`)
                }     
                target.push(`<td  class="inactive" id="${record.id}|total"></td></tr>`)//This sets the background color for items that have been updated to provide a visual cue that the element has been updated.
            }     
            html.push("</table>")
            //add form to collect observations for the irregular items
            html.push("<br>In this section, fill in only the rows corresponding to flavors you have on hand.")
            html.push(header.join(""))
            html.push(irregular.join(""))
            html.push("</table>")
            tag("inventory_panel").innerHTML=html.join("")

            // add quick buttons. The dipping cabinet locations can only have values of 0, 1/4, 1/2, 3/4, and 1. This will add buttons for inputs in the dipping cabinets.
            for(const [key,row] of Object.entries(window.rows)){
                if(isNaN(row)){
                    add_buttons(row,"Dipping Cabinet")
                }
            }

            const val_map={
                "0":0  ,
                "1":1  ,
                "2":2  ,
                "3":3  ,
                "4":4  ,
                "¼":.25,
                "½":.5 ,
                "¾":.75
            }

            // To the extent that observations may already exist for a flavor in that location in that store, they will be populated on the table. Changes to these values will also be updated.
            if(response.data.records){
                for(record of response.data.records){
                    const box=tag(record.fields.item[0] + "|" + record.fields.container.replace(/\s/g,"_"))
                    box.dataset.obs_id=record.id
                    box.value=record.fields.quantity
                    for(const div of getAllSiblings(box)){
                        // console.log(div.tagName,div.innerHTML,record.fields.quantity,val_map[div.innerHTML],record.fields.quantity===val_map[div.innerHTML])
                        if(div.tagName==="DIV" && record.fields.quantity===val_map[div.innerHTML]){
                            div.style.backgroundColor="lightGrey"
                            div.style.color="black"
                        }
                    }
                    box.parentElement.classList.add("inactive")
                    box.parentElement.classList.remove("active")
                }
            }

            // now that the data have been entered, total the rows. This will be updated every time a value is updated in the database.
            for(const [key,row] of Object.entries(window.rows)){
                if(isNaN(row)){
                    //console.log(row)
                    tag(row + "|total").innerHTML = flavor_total(row)
                }
            }

            tag("inventory_panel").addEventListener("keyup", function(event) {
                if (event.keyCode === 13) {
                    move_down(event.target);
                }
            });                
        }else{
            //This executes if the data needed to create the form or report is not retrieved successfully. It is essentially an error message to the user.
            tag("inventory_panel").innerHTML="Unable to get inventory list: " + response.message + "."
        }
    }
}

async function show_inventory_summary(params){log(4,arguments,filename,show_inventory_summary)
    console.log('in show_inventory_summary')
    //this function is used both the record inventory counts and to build a summary report. The "style" property of the params sent to the function determines whether the function is in "count" mode or "summary" mode. Also, if the user has access to multiple stores, they will be presented with the option to select the store they wish to work with.

    if(!logged_in()){show_home();return}//in case followed a link after logging out. This prevents the user from using this feature when they are not authenticated.

    //First we hide the menu
    hide_menu()
    //This function is set up recursively to build the page for working with inventory. The first time the function is called, the HTML shell is created for displaying either the inventory form for recording the count or the inventory report. Note that this will only be built if there is a "style" property set when the function is called. Once the shell is created, the function is called again to either built the form for recording an inventory count or create the summary report.
    //building the HTML shell
    tag("canvas").innerHTML=` 
        <div class="page">
            <div id="inventory-title" style="text-align:center"><h2>Ice Cream Inventory</h2></div>
            <div id="inventory-message" style="width:100%"></div>
            <div id="inventory_panel"  style="width:100%">
            </div>
        </div>  
    `
    //loading user data. Any user can record an inventory count, so we don't need to check their role at this point. If a user is associated with more than one store and they wish to record an inventory count, they will be prompted to select the store they want to work with.

    const user_data = get_user_data()
    console.log ("user_data",user_data)
    //If the user wants to see a summary of the most recent count, we call the "get_inventory_summary" function to populate the page with data from all of the stores that are associated with that user.
    tag("inventory-message").innerHTML='<i class="fas fa-spinner fa-pulse"></i>'
    
    const response=await server_request({
        mode:"get_inventory_summary",
        filter:"list='Ice Cream'",
        store:user_data.store,
    })
    tag("inventory-message").innerHTML=''

    if(response.status==="success"){//If the data is retrieved successfully, we proceed.
    
        //If the style property is set to "summary", we build the report of the most recent count.

        console.log("response", response)
        //build the HMTL heading for the report
        tag("inventory-title").innerHTML=`<h2>Ice Cream Inventory Summary</h2>`


        //Build the table to display the report. The columns of the table are: Flavor, the stores available to the user, and the total inventory. Since only the owner is given the option to view inventory counts (see the autheticated_user global variable), all stores will be shown in the report.
        const header=[`
        <table class="inventory-table">
            <tr>
            <th class="sticky">Flavor</th>
            `]

        for(const [key,val] of Object.entries(store_list())){
            if(key.indexOf("rec")===0){
                header.push(`<th class="sticky">${val}</th>`)
            }
        }

        header.push(`<th class="sticky">Total</th>`)
        header.push("</tr>")
        const html=[header.join("")]

        irregular=[]// used for icecream that is not in regular category

        //processing the data to fit in the table
        for(record of response.list.records){
            let target=html
            if(record.fields.category!=="Regular"){
                target=irregular
            }
            //add a new table row to the table for each flavor
            target.push("<tr>")
            //insert the flavor name (record.field.name)
            target.push(`<td style="text-align:left">${record.fields.name}</td>`)
            //create empty cells in the table for the inventory counts. Notice that the ID for the empty cell is set to be a combination of the id for the flavor (record.id) and the store (stores[store]) corresponding to the column. This way the table can be populated with the correct data in the correct cells.

            for(const [key,val] of Object.entries(store_list())){
                if(key.indexOf("rec")===0){
                    target.push(`<td id="${record.id}|${key}"></td>`)
                }
            }

            //The totals will be calculated. The id is set to a combination of the flavor id and "total" so that the appropriate totals can be placed correctly in the table. 
            target.push(`<td id="${record.id}|total"></td>`)
            target.push("</tr>")
        }     

        //this adds a table for the "irregular" items that might be counted.
        html.push("</table><br>")
        html.push(header.join(""))
        html.push(irregular.join(""))
        html.push("</table>")
        tag("inventory_panel").innerHTML=html.join("")


        // find the most recent numbers for each store
        const data={}
        //if there is data to display, proceed
        if(response.data.records){
            //process through each available data item
            for(record of response.data.records){
                //identity the flavor/store combination for each observation
                const id = record.fields.item[0] + "|" + record.fields.store[0]
                //Since the data is ordered by date, if we have already found an observation for a flavor/store combination, any additional obeservations are skipped.
                if(!data[id]){
                    data[id]={quantity:record.fields.quantity,date:record.fields.date}
                }
            }

            // now fill the table with the most recent observations found for each flavor/store combination
            for(const[key,value] of Object.entries(data)){
                //create "boxes" for the store observations and totals of each flavor based on the identifiers already created for the individual cells (id's of the <td> tags)
                const total_box = tag(key.split("|")[0] + "|total")
                const box = tag(key)
                //There will be more than one current observation for a flavor in each store, so we need to total these observations by store. To do this, if there is not currently a value in the table for flavor/store, it is added. If there is an observation, the new observation is added to the one that is currently there (running total logic).
                if(box.innerHTML===""){
                    box.innerHTML=value.quantity
                }else{
                    box.innerHTML=parseFloat(box.innerHTML)+value.quantity
                }
                //similar logic is used to build running totals for the grand total column.
                if(total_box.innerHTML===""){
                    total_box.innerHTML=value.quantity
                }else{
                    total_box.innerHTML=parseFloat(total_box.innerHTML)+value.quantity
                }

            }
        }
        
    }else{
        //This executes if the data needed to create the form or report is not retrieved successfully. It is essentially an error message to the user.
        tag("inventory_panel").innerHTML="Unable to get inventory list: " + response.message + "."        
    }

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

function flavor_total(flavor_id){log(4,arguments,filename,flavor_total)
    //used to calculate the running total for observations as they are entered into the input form
    let flvr_total=0
    for(const key of Object.keys(window.cols)){
        if(isNaN(key)){
           // console.log(flavor_id + "|" + key.replace(/\s/g,"_"))
            flvr_total += parseFloat(tag(flavor_id + "|" + key.replace(/\s/g,"_")).value) || 0
        }
    }
    return flvr_total
}

async function update_observation(entry){log(3,arguments,filename,update_observation)
    //this is the function that is called to update an observation when the value is change in the input form.
    //console.log(entry.parentElement)

    if(entry.parentElement.classList.contains("working")){
        // don't allow a cell currently posing to be edited.
        return
    }

    if(!logged_in()){show_home();return}//If the user logs out, not updates are permitted.
    // add data validation. If a values that is not a number has been entered, the cell is highlighted in gray and an error message is presented to the user. No update will be made.
    if(isNaN(entry.value)){
        entry.parentElement.style.backgroundColor="lightGray"
        message({
            message:"Please enter a number",
            title:"Data Error",
            kind:"error",
            seconds:5    
        })
        entry.focus()
        entry.select()

        return
    }
    //We get here if value data has been entered in an input box.
    const flavor_id = entry.id.split("|")[0] //grab the identifier for the flavor
    //build an object with the flavorID, store, container, and quantity to be updated.
    const params={
        item_id:entry.dataset.item_id,
        quantity:entry.value,
        container:entry.dataset.container,
        store:entry.dataset.store,
    }
    //visually signal by modifying the appearance of the cell that the value is currently being updated.
    entry.parentElement.style.backgroundColor=null
    entry.parentElement.classList.add("working")
    
    if(entry.dataset.obs_id){
        // there is already a record for this item.  update it
        params.mode="update_inventory_count"
        params.obs_id=entry.dataset.obs_id
        console.log("updating", params.obs_id)
        //use the server_request function to update the value (the update_inventory_count function in google app script is called and the appropriate flavor, store, container, and quantity information is passed)
        const response=await server_request(params)    
        console.log("update response", response)
        
        if(response.status==="success"){//if the value is successfully updated, the appearance of the cell is changed to reflect the update.
            console.log("updated", flavor_total)
            tag(flavor_id + "|total").innerHTML = flavor_total(flavor_id)
            entry.parentElement.classList.remove("working")
            entry.parentElement.classList.remove("active")
            entry.parentElement.classList.add("inactive")
            entry.dataset.obs_id=response.records[0].id
            return true
        }else{//if the value is not successfully updated, the appearance of the cell is changed to reflect an error and an error message is presented to the user.
            entry.style.backgroundColor="red"
            message({
                message:"Inventory Not Recorded: " + response.message,
                title:"Data Error",
                kind:"error",
                seconds:5    
            })
            return false
        }

    }else{
        // there is no record for this item, insert it using the "insert_inventory_count" function in google app script
        params.mode="insert_inventory_count"
        console.log("inserting")
        const response=await server_request(params)    
        console.log("insert response", response)
        
        if(response.status==="success"){//If it is inserted correctly, the appearance of the cell is changed to reflect the update.
            tag(flavor_id + "|total").innerHTML = flavor_total(flavor_id)
            entry.parentElement.classList.remove("working")
            entry.parentElement.classList.remove("active")
            entry.parentElement.classList.add("inactive")
            entry.dataset.obs_id=response.records[0].id
            return true
        }else{//If it is not inserted correctly, the appearance of the cell is changed to reflect the error and the error message is presented.
            entry.style.backgroundColor="red"
            message({
                message:"Inventory Not Recorded: " + response.message.message,
                title:"Data Error",
                kind:"error",
                seconds:5    
            })
            }
            return false
    }
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

