import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as fs from 'fs';
import * as QRCodeTerminal from 'qrcode-terminal'

const packageDefinition = protoLoader.loadSync('./lightning.proto', {
  keepCase: true,
  defaults: true,
  oneofs: true,
});

const lnrpc: any = grpc.loadPackageDefinition(packageDefinition).lnrpc;

const macaroon = fs.readFileSync('./invoice.macaroon').toString('hex');
const metadata = new grpc.Metadata();
metadata.add('macaroon', macaroon);
const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_args, callback) => {
	callback(null, metadata);
});

const sslCreds = grpc.credentials.createSsl(
  fs.readFileSync('./tls.cert')
);

var credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

// console.log('macaroon', macaroon);
// console.log('metadata', metadata);

const lnd = new lnrpc.Lightning('umbrel.local:10009', credentials);

let request = {
	show: true,
	level_spec: "info",
  };
// @ts-ignore
// lnd.debugLevel(request, function(err, response) {
// 	if (err) {
// 		console.error('debug err', err)
// 	}
// 	if (response) {
// 		console.log('debug response', response);
// 	}
// });

const addInvoice = () => {

	const randomNumber = Math.floor(Math.random() * 1000) + 1

	const invoice = {
		value: randomNumber, // amount in satoshis
		memo: `Test Invoice for ${randomNumber.toLocaleString()} sats`,
	};
	console.log('will attempt to make an invoice for', invoice);

	lnd.addInvoice(invoice, (error: any, response: {payment_request: string}) => {
		if (error) {
		  console.error(error);
		  return;
		}
		console.log('response', response);
		renderQRCode(response.payment_request)
	});
}

const listInvoices = () => {
	let request = {
		pending_only: false,
		// index_offset: <uint64>,
		num_max_invoices: 10,
		reversed: true,
		// creation_date_start: <uint64>,
		// creation_date_end: <uint64>,
	};

	console.log('metadata in list invoices', metadata);
	// todo
	// @ts-ignore
	lnd.listInvoices(request, (err, response) =>{
		if (err) {
			console.error('err listing invoices', err)
		}
		if (response) {
			console.log('response', response);
		}
		// console.log('something?', response, err);
	});
}

const renderQRCode = (data: string) => {
	QRCodeTerminal.generate(data, {small: true}, function (qrcode: any) {
		console.log(qrcode)
	})
}

const main = () => {
	// addInvoice();
	listInvoices()
}

main()
