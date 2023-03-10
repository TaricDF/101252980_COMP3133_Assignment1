const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const User = require('./models/user');
const Employee = require('./models/employee');

const app = express();

app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
    schema: buildSchema(`
        type User {
            _id: ID!
            username: String!
            email: String!
            password: String!
        }

        type Employee {
            _id: ID!
            first_name: String!
            last_name: String!
            gender: String!
            salary: Float!
            email: String!
        }

        input UserInput {
            username: String!
            email: String!
            password: String!
        }

        input EmployeeInput {
            first_name: String!
            last_name: String!
            gender: String!
            salary: Float!
            email: String!
        }

        type RootQuery {
            users: [User!]!
        }

        type RootMutation {
            createUser(userInput: UserInput): User
            createEmployee(employeeInput: EmployeeInput): Employee
        }

        schema {
            query: RootQuery
            mutation: RootMutation
        }   
    `),
    rootValue: {
        users: () => {
            return User.find()
            .then(users => {
                return users.map(user => {
                    return { ...user._doc };
                })
            })
            .catch(err => {
                throw err;
            });
        },
        createUser: (args) => {
            return User.findOne({ email: args.userInput.email })
            .then(user => {
                if (user) {
                    throw new Error('User exists already.');
                }
                return bcrypt.hash(args.userInput.password, 12);
            })
            .then(hashedPassword => {
                const user = new User({
                    username: args.userInput.username,
                    email: args.userInput.email,
                    password: hashedPassword
                });
                return user.save();
            })
            .then(result => {
                return { ...result._doc };
            })
            .catch(err => {
                throw err;
            });
        },
        createEmployee: (args) => {
            return Employee.findOne({ email: args.employeeInput.email })
            .then(employee => {
                if (employee) {
                    throw new Error('Employee already exists.');
                }
            })
            .then(() => {
                const employee = new Employee({
                    first_name: args.employeeInput.first_name,
                    last_name: args.employeeInput.last_name,
                    gender: args.employeeInput.gender,
                    salary: args.employeeInput.salary,
                    email: args.employeeInput.email
                });
                return employee.save();
            })
            .then(result => {
                return { ...result._doc };
            })
            .catch(err => {
                throw err;
            });
        }
    },
    graphiql: true
}));

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:
${process.env.MONGO_PASSWORD}@cluster0.raa3kqq.mongodb.net/${process.env.MONGO_DB}`)
.then(() => {
    app.listen(3000);
}).catch(err => {
    console.log(err);
});

