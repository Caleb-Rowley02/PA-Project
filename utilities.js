filename="utilities.js"// used to control logging

function hide_elements(className){ log(2,arguments,filename,hide_elements)
    // adds the hidden class to all elements of the given class name
    if(Array.isArray(className)){
        var classes=className
    }else{
        var classes=[className]
    }

    for(const one_class of classes){
        for(const elem of document.getElementsByClassName(one_class)){
            elem.classList.add("hidden")
        }
    }
}
function show_elements(className){log(2,arguments,filename,show_elements)
    // remvoes the hidden class to all elements of the given class name
    if(Array.isArray(className)){
        var classes=className
    }else{
        var classes=[className]
    }
    
    for(const one_class of classes){
        for(const elem of document.getElementsByClassName(one_class)){
            elem.classList.remove("hidden")
        }
    }
}


function getAllSiblings(elem, filter) {log(2,arguments,filename,getAllSiblings)
    //used to help with the creation of the input buttons to group options for each flavor.
    var sibs = [];
    elem = elem.parentNode.firstChild;
    do {
        //if (elem.nodeType === 3) continue; // text node
        //if (!filter || filter(elem))
        sibs.push(elem);
    } while (elem = elem.nextSibling)
    return sibs;
}

function json_params_for_url(params){log(2,arguments,filename,json_params_for_url)
    // encode an object without the trailing equalsigns
    const data=btoa(JSON.stringify(params))
    if(data.slice(-2)==="=="){
        return data.slice(0, -2)
    }
    
    if(data.slice(-1)==="="){
        return data.slice(0, -1)
    }
    
    return data    
}

async function submit_form(form){log(2,arguments,filename,submit_form)
    //this function is not used, but could be used to submit form data to google app script to update Airtable.
    return await server_request(form_data(form))
}

function form_data(html_tag,spin){log(2,arguments,filename,form_data)
    // read the informatoin from a form and put it into an object, ready to be sent to server_request
    const payload={}// the object to return with the form's values
    // if the html_tag sent it is a button, and spin is true, change the button's text to a spinner
    if(html_tag.tagName==="BUTTON"){
        payload.button=html_tag.innerHTML  // record the button that was pressed.  This will be useful when there are many buttons on a form and you need to know which a user pressed
        if(spin){
          html_tag.innerHTML='<i class="fas fa-spinner fa-pulse"></i>'
        }
    }

    // search up the html element hierarchy to find the form
    while(html_tag.tagName !== "FORM"){
        console.log('html_tag',html_tag)
        html_tag=html_tag.parentElement
        if(html_tag.tagName==="BODY"){
            throw 'Object submitted is not a form and us not contained in a form.'; 
        }
    }

    // now we know that html_tag is a form, so read the values and bulid the object
    for(const element of html_tag.elements){
        console.log(element.tagName, element)
        if((element.tagName==="INPUT" || element.tagName==="SELECT" ||  element.tagName==="TEXTAREA") && element.name){
            // it's a tag with data
            if(!payload[element.name]){
                // the named data element has not yet been added to the payload; add it.
                payload[element.name]=[]
            }
            if(element.value){
                payload[element.name].push(element.value)
            }else{
                payload[element.name].push(element.innerHTML)
            }
        }
    }

    // look across payload and any data elements that have only one entry, make them variables instead of arrays
    for(const key of Object.keys(payload)){
        if(payload[key].length===1){
            payload[key]=payload[key][0]
        }
    }
    console.log("in form_data.  Payload",payload)
    return payload
}

function url_parameters(){log(1,arguments,filename,url_parameters)
    if(!location.search){
        return {fn:"show_home"}  
    }else if(location.search.includes("=")){
        // normal pairs of parameters
        var pairs = location.search.slice(1).split('&');
    
        var result = {};
        pairs.forEach(function(pair) {
            pair = pair.split('=');
            result[pair[0]] = decodeURIComponent(pair[1] || '');
        });
    
        return JSON.parse(JSON.stringify(result));
    }else if(location.search){
        // this must be a base 64 encoded json object
        return JSON.parse(atob(location.search.substr(1)))
    }
}

function set_cookie(name,value,days) {log(2,arguments,filename,set_cookie)
    //used to update cookie information
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function get_cookie(name) {log(2,arguments,filename,get_cookie)
    //used to retrieve cookie by name
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function erase_cookie(name) {log(2,arguments,filename,erase_cookie)
    //used to delete a cookie by name
    //console.log("at erase cookie", name)
    set_cookie(name,"deleted",-2)
    //document.cookie = name+'=; Max-Age=-99999999;';  
}

function tag(id){log(1,arguments,filename,tag)
    //Adds an ID to an HTML element
    return document.getElementById(id)
}

function toggle(tag_or_id,display="block"){log(2,arguments,filename,toggle)
    
    
    let element=tag_or_id
    if(!element.tagName){
        // assume caller passed in a tag id, as tag_or_id 
        // does not have a tag name it cannot be a tag
        element=tag(tag_or_id)
    }

    //console.log("element", element)
    if(element.style && element.style.display===display){
        element.style.display="none"
        return false
    }else{
        element.style.display=display
        return true
    }
}

function intersect(string_or_array, array_or_string) {log(2,arguments,filename, intersect)
    // returns the intersection of two arrays
    if(Array.isArray(string_or_array)){
      var a=string_or_array
    }else{
      var a=[string_or_array]
    }

    if(Array.isArray(array_or_string)){
      var b=array_or_string
    }else{
      var b=[array_or_string]
    }

    var setB = new Set(b);
    return [...new Set(a)].filter(x => setB.has(x));
}

function is_valid_email(email){log(2,arguments,filename,is_valid_email)
    // returns true if true if email is in form:
    // anystring@anystring.anystring
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}

