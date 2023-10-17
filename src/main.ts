import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as fs from 'fs';
import * as QRCodeTerminal from 'qrcode-terminal'

const packageDefinition = protoLoader.loadSync('./lightning.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const lnrpc: any = grpc.loadPackageDefinition(packageDefinition).lnrpc;

const macaroon = fs.readFileSync('./invoice.macaroon').toString('hex');
const metadata = new grpc.Metadata();
metadata.add('macaroon', macaroon);

const credentials = grpc.credentials.createSsl(
  fs.readFileSync('./tls.cert')
);


const lnd = new lnrpc.Lightning('umbrel.local:10009', credentials);

let request = {
	show: true,
	level_spec: "info",
  };
// @ts-ignore
lnd.debugLevel(request, function(err, response) {
	if (err) {
		console.error('err', err)
	}
	if (response) {
		console.log('response', response);
	}
});

const addInvoice = () => {

	const randomNumber = Math.floor(Math.random() * 1000) + 1

	const invoice = {
		value: randomNumber, // amount in satoshis
		memo: `Test Invoice for ${randomNumber.toLocaleString()} sats`,
	};
	console.log('will attempt to make an invoice for', invoice);

	lnd.addInvoice(invoice, metadata, (error: any, response: {payment_request: string}) => {
		if (error) {
		  console.error(error);
		  return;
		}
		console.log('response', response);
		console.log('Invoice:', response);
		renderQRCode(response.payment_request)
	});
}

const renderQRCode = (data: string) => {
	QRCodeTerminal.generate(data, {small: true}, function (qrcode: any) {
		console.log(qrcode)
	})
}

const main = () => {
	addInvoice();
}

main()
