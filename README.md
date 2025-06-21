# SENG365 Assignment 1 API Server (Petition Site)

# Overview

Full Stack Petitions NodeJS API Project for Web Computing Architectures. Uses Typescript, Express.js. [Link to project recordings](https://drive.google.com/drive/folders/1l3dRC8Xoe5sIWdJNtHJkqTVCakvrLaIG?usp=drive_link)

## Running locally

1. Use `npm install` to populate the `node_modules/` directory with up-to-date packages
2. Create a file called `.env`, following the instructions in the section below
3. Go to https://dbadmin.csse.canterbury.ac.nz and create a database with the name that you set in the `.env` file
2. Run `npm run start` or `npm run debug` to start the server
3. The server will be accessible on `localhost:4941`

### `.env` file

Create a `.env` file in the root directory of this project including the following information (note that you will need
to create the database first in phpMyAdmin):

```
SENG365_MYSQL_HOST=db2.csse.canterbury.ac.nz
SENG365_MYSQL_USER={your usercode}
SENG365_MYSQL_PASSWORD={your password}
SENG365_MYSQL_DATABASE={a database starting with your usercode then an underscore}
```

For example:

```
SENG365_MYSQL_HOST=db2.csse.canterbury.ac.nz
SENG365_MYSQL_USER=abc123
SENG365_MYSQL_PASSWORD=password
SENG365_MYSQL_DATABASE=abc123_s365
```

## Some notes about endpoint status codes

The api spec provides several status codes that each endpoint can return. Apart from the 500 'Internal Server Error'
each of these represents a flow that may be tested. Hopefully from the labs you have seen these status codes before and
have an understanding of what each represents. A brief overview is provided in the table below.

| Status Code | Status Message        | Description                                                                   | Example                                          |
|:------------|-----------------------|-------------------------------------------------------------------------------|--------------------------------------------------|
| 200         | OK                    | Request completed successfully                                                | Successfully get petitions                       |
| 201         | Created               | Resources created successfully                                                | Successfully create a petition                   |
| 400         | Bad Request           | The request failed due to client error                                        | Creating a petition without a request body       |
| 401         | Unauthorised          | The requested failed due invalid authorisation                                | Creating a petition without authorisation header |
| 403         | Forbidden             | The request is refused by the server                                          | Trying to delete someone else's petition         |
| 500         | Internal Server Error | The request causes an error and cannot be completed                           |                                                  |
| 501         | Not Implemented       | The request can not be completed because the functionality is not implemented |                                                  | 

Note: In some cases we will accept more than one status code as correct, the case for this is when a user asks to
complete a forbidden action on a resource that does not exist. This is because the response depends on the order of
operations, if you check the resource is missing first then a 404 makes sense, if you check whether a user is 'allowed'
to complete the action first a 403 makes sense. In a proper application, you may also think about which one of these
responses is better, and gives away the least information about the system to the client.

## How marking works

A Postman collection has been provided in the `postman` folder, you can easily import this (and the specific
environment variables) to test your assignment as you work on it. More information about the exact steps can be found in
Lab 2. **Note:** You will need to copy the images within the files folder to your Postman working directory.

This Postman collection is a subset of the tests your application will be marked against so passing these tests should
be your highest priority. You may wish to add to this collection yourself to have more tests to validate your work
against as you go.
**Note:** The collection provided accounts for about half of the total tests.

## Steps you should take before finishing

Before finalising your code, you should

1. Import a fresh copy of your project from Eng-Git
2. Create a `.env` file with only the fields discussed above
3. `run npm install`
4. `run npm run start`
5. Run the Postman collection provided and check that the tests are running as expected

These steps will help you find issues such as:

1. Required dependencies not included in your `package.json`
2. Use of other environment variables that will not be used during marking

## Final notes

We suggest that you do not modify the files within the `src/app/resources` folder as we may update these at any time if there is
an issue (such as updating the api spec). Whilst you are free to modify the Postman collection it may be safer to do
this through Postman only and not push the updated collection (or push your updated version under a different name).

Images within the `storage\default` folder should not be removed, when reloading the server these will be copied to
storage\images where the server can add, update or delete them when running.

If you find an inconsistency or issue with the reference server please reach out to Morgan English
`morgan.english@canterbury.ac.nz`.
