
//YOUR ACCOUNTS CREDENTIALS

//Add your accounts domain
const myDomain = "";
//Your preferred redirect page. I use localhost:5500 here as it will redirect to the index.html. I use Liveserver to run the application
const redirUri = "http://localhost:5500/";
//Your OIDC clients ID
const clientId = "";
//Base64 encoded clientID:secret + =
const encodedCred = "";

//GET CODE URL
//Here we are creating the url we start the end users authorization flow. Double check that your scopes are correct according to your OIDC client.
const codeUrl = `${myDomain}/auth/open/connect/authorize?client_id=${clientId}&response_type=code&scope=openid+profile+nin&prompt=login&redirect_uri=${redirUri}`;

//URLS
//Here we create the end points for getting token and userinfo
const tokenUrl = `${myDomain}/auth/open/connect/token`;
const userUrl = `${myDomain}/auth/open/connect/userinfo`;

//ELEMENTS
//Here we are targeting the elements in the index.html page.
const myButton = document.querySelector("button");
const container = document.querySelector(".container");
const getCodeContainer = document.querySelector(".getCodeContainer");

//We are creating a link that appears in the index page, that will start the auth flow.
getCodeContainer.innerHTML = `<a href="${codeUrl}">Get User info with "${clientId}"</a>`;

//An asynchronous function that will grab the code, POST to get an access token, and then GET the userinfo.
async function getToken() {
    //We clear the local storage since it is where we store the access token.
    localStorage.clear();

    //User will do the auth flow, and will be redirected back to index.html with a param in the url identified as "code".

    //Here we get the parameter called "code" and store its value in the "paramCode" variable.
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const paramCode = urlParams.get("code");
    console.log(paramCode);

    //We do a POST fetch request to the token url. And store the response of that request to a variable called "response"
    const response = await fetch(tokenUrl, {
        method: 'POST',
        //Headers uses the base64 encoded clientID:secret as authorization
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${encodedCred}`
        },
        //Our body/payload, uses the stored value of the code we got from the parameters earlier.
        body: new URLSearchParams({
            'client_id': clientId,
            'redirect_uri': redirUri,
            'grant_type': 'authorization_code',
            'code': `${paramCode}`
        })
    });

    //We create a json out of our response, and target the .access_token, storing it in the newToken variable.
    const json = await response.json();
    const newToken = json.access_token;
    console.log(newToken);

    //if newToken exists, we store it in localStorage with a key of "mytoken"
    if(newToken) {
        localStorage.setItem('mytoken', newToken)
    }
    else {
        console.log("not a valid token")
    }

    //We run the get user function we created below
    getUser();

}

//Asynchronous function where we get the access token stored in local storage earlier, to do a GET request to get the user info.
async function getUser() {
    //Get the access token from localStorage which we stored in the last function, and store it in the "myToken" variable.
    const myToken = localStorage.getItem('mytoken');
    
    //We do a GET fetch request to the userUrl endpoint we created in the start, and store the result in "response" variable
    const response = await fetch(userUrl, {
        method: 'GET',
        //Headers uses Bearer authorization with the access token we extracted.
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${myToken}`
        }
    });
    //We create json from the response we got from the GET request.
    const json = await response.json()
    //Check your browser console for a more detailed JSON object.
    console.log(json)

    //We take that user info and display it in the index.html page.
    container.innerHTML = `
    <h2>User</h2>
    <ul>
        <li>First Name: <span>${json.given_name}</span></li>
        <li>Last Name: <span>${json.family_name}</span></li>
        <li>Birthdate: <span>${json.birthdate}</span></li>
        <li>Personal Number: <span>${json.nin}</span></li>
    </ul>`;
} 

//This funcion will run every time the page is loading.
//Remember to open the client tool and check the console log to see the JSON response for user info.
getToken();