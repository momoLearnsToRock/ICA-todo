# ica-dek-backend

This is the repository of the backend for Ica Digital Egenkontroll, that is, the swagger definitions and the code for the TodoService.

## People

The current team consists of: 
* Göran, [roseeng](https://github.com/roseeng)
* Momo, [MomoLearnsToRock](https://github.com/momolearnstorock)
* Daniel J, [skurtbert](https://github.com/skurtbert)
* Abdallah, (mailto:abdallah.rifai@acando.com)

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



