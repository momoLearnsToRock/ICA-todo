# ica-dek-backend

This is the repository of the backend for Ica Digital Egenkontroll, that is, the swagger definitions and the code for the TodoService.

## People

The current team consists of: 
* Göran, [roseeng](https://github.com/roseeng)
* Momo, [MomoLearnsToRock](https://github.com/momolearnstorock)
* Daniel J, [skurtbert](https://github.com/skurtbert)
* Abdallah, [AboAdam](https://github.com/AboAdam)

## Swagger definitions
### Input

The files are maintained on Swaggerhub (https://app.swaggerhub.com/apis/ica-egenkontroll/) and there is a github integration
connected to this repository, which means that most activity in this repo will be automatic. Swaggerhub pushes to the SWAGGERHUB branch. From there we manually create a merge request with a nice description, which we then accept.

### Output

The swagger files are stored in both yaml and json format.
Swaggerhub also creates html documentation. The master branch is published as Github Pages, that you can look at here:

https://itchdx.github.io/ica-dek-backend/

The pages there are the recommended contract between frontend and backend.

## Code

The backend code can be found in /TodoService. 

## Servers

### TodoService

#### Test
The build server builds to a dev instance with the address https://ic-todo.azurewebsites.net/.

##### HOWTO: Deploy to test
1. Checkout origin/master
2. Run tests: `npm run test`
2. Connect to Azure: git remote add azure `https://[your_deployment_user]@ic-todo.scm.azurewebsites.net:443/ic-todo.git`
3. Push to build server: git push azure master
4. Sip on a cup of coffee and for build server to compile code...

#### Production
Once stable, by doing <insert description  here>, you deploy to the integration server which is used by the frontend project. Its adress is https://ica-todo-backend-prod.azurewebsites.net/.
  
So to test fetching all todos, you can try: https://ica-todo-backend-prod.azurewebsites.net/todos

### UserService

We also have a mock server for the UserService, while we wait for a decision on who is going to build it.
The code is in our repo in Ica's Gitlab and it is deployed to http://dek-ica-userservice.azurewebsites.net/.

You can try it out by e.g. fetching http://dek-ica-userservice.azurewebsites.net/users in the browser.

### SetUp For New Developers 

As a new developer you will need first to install some programs .

step 1 :

- Start with node.js ,  https://nodejs.org/en/download/
- install Git , https://git-scm.com/downloads 
- VS Code , https://code.visualstudio.com/download 

step 2 : 

- click on clone or download here on github and copy the url of the project 
- go to any command prompt and create a folder for you project e.g. mkdir ICA
- use git commands to download the project start with git init 
- git clone https://github.com/itchDX/ica-dek-backend.git to download 
- code . => that will open it in vs code . 

step 3 : 

- run npm install in the command prompt (you can use vs code built in cmd )
- ctrl+shift+B  to build the project . 
- Run tests: `npm run test`

finally : 
 
 if you get any errors so get a coffe and check with the guys who's names listed above to help you solve them  :) 
