import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as fs from 'fs';

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

const invoice = {
	value: 1000, // amount in satoshis
	memo: 'Test Invoice',
};
  

const lnd = new lnrpc.Lightning('umbrel.local:10009', credentials);
lnd.addInvoice(invoice, metadata, (error: any, response: any) => {
	if (error) {
	  console.error(error);
	  return;
	}
	console.log('Invoice:', response);
});