const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

function verifyIfAccountExistsCPF(req, res, next) {
	const { cpf } = req.headers;

	const customer = customers.find(customer => customer.cpf === cpf);

	if (!customer) {
		return res.json({ error: 'Customer not found!' });
	}

	req.customer = customer;

	return next();
}

function getBalance(statement) {
	const balance = statement.reduce((acc, operation) => {
		if (operation.type === 'credit') {
			return acc + operation.amount;
		} else {
			return acc - operation.amount;
		}
	}, 0);

	return balance;
}

app.post('/account', (req, res) => {
	const { cpf, name } = req.body;

	const customerAlreadyExists = customers.some(
		customer => customer.cpf === cpf
	);

	if (customerAlreadyExists) {
		return res.status(400).json({ error: 'Customer already exists!' });
	}

	customers.push({
		cpf,
		name,
		id: uuidv4(),
		statement: [],
	});

	return res.status(201).send();
});

app.get('/statement', verifyIfAccountExistsCPF, (req, res) => {
	const { customer } = req;

	res.json(customer.statement);
});

app.post('/deposit', verifyIfAccountExistsCPF, (req, res) => {
	const { description, amount } = req.body;

	const { customer } = req;

	const statementOperation = {
		description,
		amount,
		created_at: new Date(),
		type: 'credit',
	};

	customer.statement.push(statementOperation);

	return res.status(201).send();
});

app.post('/withdraw', verifyIfAccountExistsCPF, (req, res) => {
	const { amount } = req.body;
	const { customer } = req;

	const balance = getBalance(customer.statement);

	console.log(balance);

	if (balance < amount) {
		return res.status(400).json({ error: 'Insufficient funds!' });
	}

	const statementOperation = {
		amount,
		created_at: new Date(),
		type: 'debit',
	};

	customer.statement.push(statementOperation);

	return res.status(201).send();
});

app.get('/statement/date', verifyIfAccountExistsCPF, (req, res) => {
	const { customer } = req;
	const { date } = req.query;

	const dateFormat = new Date(date + ' 00:00');

	const statement = customer.statement.filter(
		statement =>
			statement.created_at.toDateString() ===
			new Date(dateFormat).toDateString()
	);

	res.json(statement);
});

app.put('/account', verifyIfAccountExistsCPF, (req, res) => {
	const { name } = req.body;

	const { customer } = req;

	customer.name = name;

	return res.status(201).send();
});

app.get('/account', verifyIfAccountExistsCPF, (req, res) => {
	const { customer } = req;

	return res.status(201).json(customer);
});

app.delete('/account', verifyIfAccountExistsCPF, (req, res) => {
	const { customer } = req;

	customers.splice(customer, 1);

	res.status(200).json(customers);
});

app.get('/balance', verifyIfAccountExistsCPF, (req, res) => {
	const { customer } = req;

	const balance = getBalance(customer.statement);

	res.json(balance);
});

app.listen(3333, () => console.log('Listening on localhost:3333'));
