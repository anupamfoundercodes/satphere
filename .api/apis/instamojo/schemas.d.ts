declare const CreateAPaymentRequest1: {
    readonly formData: {
        readonly type: "object";
        readonly required: readonly ["amount", "purpose"];
        readonly properties: {
            readonly amount: {
                readonly type: "number";
                readonly description: "The amount for the request. The minimum amount is 9. And the maximum is 200000.";
                readonly format: "double";
                readonly minimum: -1.7976931348623157e+308;
                readonly maximum: 1.7976931348623157e+308;
            };
            readonly purpose: {
                readonly type: "string";
                readonly description: "Purpose of the payment request.";
            };
            readonly buyer_name: {
                readonly type: "string";
                readonly description: "Name of payer";
            };
            readonly email: {
                readonly type: "string";
                readonly description: "Email of payer";
            };
            readonly phone: {
                readonly type: "string";
                readonly description: "Phone number of payer";
            };
            readonly redirect_url: {
                readonly type: "string";
                readonly description: "URL where we redirect the user after a payment. If provided, we will redirect the user to `redirect_url` immediately after the payment has been processed. Three additional query arguments `payment_request_id`, `payment_status` and `payment_id` are also sent with the redirect URL.";
            };
            readonly webhook: {
                readonly type: "string";
                readonly description: "URL where our server do POST request after a payment  If provided, we will do a the POST request to the webhook (url) with full details of the payment";
            };
            readonly allow_repeated_payments: {
                readonly type: "boolean";
                readonly description: "If `allow_repeated_payments` is `false`, only one payment can be paid on a payment request link. `allow_repeated_payments` is `true` by default.";
                readonly default: false;
            };
            readonly send_email: {
                readonly type: "boolean";
                readonly description: "Flag to send request link via email.  If `send_email` is `true`, a request email will be sent to the email supplied. If `send_email` is `true` but no email is supplied, request creation will throw an error.";
                readonly default: false;
            };
            readonly expires_at: {
                readonly type: "string";
                readonly description: "Time after which the payment request will be expired in UTC timestamp. Max value is 600 seconds. Default is Null";
                readonly format: "date";
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly Authorization: {
                    readonly type: "string";
                    readonly default: "Bearer <your-token>";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly examples: readonly ["05f317448ad84649aa1a9c7328edb015"];
                };
                readonly user: {
                    readonly type: "string";
                    readonly examples: readonly ["https://api.instamojo.com/v2/users/90f01dfdacbe4fe7892fc27dbdc30906/"];
                };
                readonly phone: {
                    readonly type: "string";
                    readonly examples: readonly ["+919999999999"];
                };
                readonly email: {
                    readonly type: "string";
                    readonly examples: readonly ["foo@example.com"];
                };
                readonly buyer_name: {
                    readonly type: "string";
                    readonly examples: readonly ["John Doe"];
                };
                readonly amount: {
                    readonly type: "string";
                    readonly examples: readonly ["2500"];
                };
                readonly purpose: {
                    readonly type: "string";
                    readonly examples: readonly ["FIFA 16"];
                };
                readonly status: {
                    readonly type: "string";
                    readonly examples: readonly ["Pending"];
                };
                readonly payments: {
                    readonly type: "array";
                    readonly items: {};
                };
                readonly send_sms: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly send_email: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly sms_status: {
                    readonly type: "string";
                    readonly examples: readonly ["Pending"];
                };
                readonly email_status: {
                    readonly type: "string";
                    readonly examples: readonly ["Pending"];
                };
                readonly shorturl: {};
                readonly longurl: {
                    readonly type: "string";
                    readonly examples: readonly ["https://www.instamojo.com/@foo/05f317448ad84649aa1a9c7328edb015"];
                };
                readonly redirect_url: {
                    readonly type: "string";
                    readonly examples: readonly ["http://www.example.com/redirect/"];
                };
                readonly webhook: {
                    readonly type: "string";
                    readonly examples: readonly ["http://www.example.com/webhook/"];
                };
                readonly created_at: {
                    readonly type: "string";
                    readonly examples: readonly ["2016-05-09T16:10:13.786Z"];
                };
                readonly modified_at: {
                    readonly type: "string";
                    readonly examples: readonly ["2016-05-09T16:10:13.786Z"];
                };
                readonly resource_uri: {
                    readonly type: "string";
                    readonly examples: readonly ["https://api.instamojo.com/v2/payment_requests/05f317448ad84649aa1a9c7328edb015/"];
                };
                readonly allow_repeated_payments: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly mark_fulfilled: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly purpose: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["This field is required."];
                    };
                };
                readonly amount: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["This field is required."];
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Authentication credentials were not provided."];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const CreateARefund1: {
    readonly formData: {
        readonly type: "object";
        readonly required: readonly ["type", "body", "transaction_id"];
        readonly properties: {
            readonly type: {
                readonly type: "string";
                readonly description: "A three letter short-code identifying the reason for this case.";
            };
            readonly body: {
                readonly type: "string";
                readonly description: "Additonal text explaining the refund.";
            };
            readonly refund_amount: {
                readonly type: "string";
                readonly description: "This field can be used to specify the refund amount. For instance, you may want to issue a refund for an amount lesser than what was paid. Default is paid amount.";
                readonly default: "Paid amount";
            };
            readonly transaction_id: {
                readonly type: "string";
                readonly description: "Mandatory parameter in the body from the second case creation onwards for the payment to prevent duplicate case creations due to replay of APIs";
                readonly default: "required";
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly payment_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["payment_id"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly Authorization: {
                    readonly type: "string";
                    readonly default: "Bearer <your-token>";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly refund: {
                    readonly type: "object";
                    readonly properties: {
                        readonly id: {
                            readonly type: "string";
                            readonly examples: readonly ["C5c0751269"];
                        };
                        readonly payment_id: {
                            readonly type: "string";
                            readonly examples: readonly ["MOJO5c04000J30502939"];
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly examples: readonly ["Refunded"];
                        };
                        readonly type: {
                            readonly type: "string";
                            readonly examples: readonly ["QFL"];
                        };
                        readonly body: {
                            readonly type: "string";
                            readonly examples: readonly ["Customer isn't satisfied with the quality"];
                        };
                        readonly refund_amount: {
                            readonly type: "string";
                            readonly examples: readonly ["100"];
                        };
                        readonly total_amount: {
                            readonly type: "string";
                            readonly examples: readonly ["100.00"];
                        };
                        readonly created_at: {
                            readonly type: "string";
                            readonly examples: readonly ["2015-12-07T11:01:37.640Z"];
                        };
                    };
                };
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Authentication credentials were not provided."];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const CreateAnOrderUsingPaymentRequestId1: {
    readonly formData: {
        readonly type: "object";
        readonly properties: {
            readonly id: {
                readonly type: "string";
                readonly description: "Payment Request ID";
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly Authorization: {
                    readonly type: "string";
                    readonly default: "Bearer <your-token>";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly order_id: {
                    readonly type: "string";
                    readonly examples: readonly ["3b56d216-74c2-4189-83f3-9c2e93bad1be"];
                };
                readonly name: {
                    readonly type: "string";
                    readonly examples: readonly ["Vedhavyas"];
                };
                readonly email: {
                    readonly type: "string";
                    readonly examples: readonly ["vedhavyas@instamojo.com"];
                };
                readonly phone: {
                    readonly type: "string";
                    readonly examples: readonly ["+919663445546"];
                };
                readonly amount: {
                    readonly type: "string";
                    readonly examples: readonly ["100.00"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["This field is required."];
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Authentication credentials were not provided."];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const CreatingVirtualAccounts: {
    readonly formData: {
        readonly type: "object";
        readonly properties: {
            readonly assigned_to: {
                readonly properties: {
                    readonly name: {
                        readonly type: "string";
                    };
                    readonly email: {
                        readonly type: "string";
                    };
                    readonly phone: {
                        readonly type: "string";
                    };
                };
                readonly required: readonly ["name", "email", "phone"];
                readonly type: "object";
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly examples: readonly ["46665650939090909090"];
                };
                readonly assigned_to: {
                    readonly type: "object";
                    readonly properties: {
                        readonly name: {
                            readonly type: "string";
                            readonly examples: readonly ["Customer Name"];
                        };
                        readonly email: {
                            readonly type: "string";
                            readonly examples: readonly ["customer@example.com"];
                        };
                        readonly phone: {
                            readonly type: "string";
                            readonly examples: readonly ["9090909090"];
                        };
                    };
                };
                readonly beneficiary: {
                    readonly type: "object";
                    readonly properties: {
                        readonly account_number: {
                            readonly type: "string";
                            readonly examples: readonly ["46665650939090909090"];
                        };
                        readonly ifsc: {
                            readonly type: "string";
                            readonly examples: readonly ["YESB0CMSNOC"];
                        };
                        readonly bank_name: {
                            readonly type: "string";
                            readonly examples: readonly ["Yes Bank"];
                        };
                        readonly account_holder_name: {
                            readonly type: "string";
                            readonly examples: readonly ["Test Merchant"];
                        };
                    };
                };
                readonly resource_uri: {
                    readonly type: "string";
                    readonly examples: readonly ["http://api.instamojo.com/v2/virtual_accounts/46665650939090909090/"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Authentication credentials were not provided."];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const DisableARequest: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const EnableARequest: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const FulfilAPayment: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly payment_id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["payment_id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly fulfil: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [true];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Authentication credentials were not provided."];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GenerateAccessTokenApplicationBasedAuthentication: {
    readonly formData: {
        readonly type: "object";
        readonly required: readonly ["grant_type", "client_id", "client_secret"];
        readonly properties: {
            readonly grant_type: {
                readonly type: "string";
                readonly description: "This describes the type of authentication.";
                readonly default: "client_credentials";
            };
            readonly client_id: {
                readonly type: "string";
                readonly description: "The client_id that is provided to you.";
            };
            readonly client_secret: {
                readonly type: "string";
                readonly description: "The client_secret that is provided to you.";
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly access_token: {
                    readonly type: "string";
                    readonly examples: readonly ["y70kak2K0Rg7J4PAL8sdW0MutnGJEl"];
                };
                readonly token_type: {
                    readonly type: "string";
                    readonly examples: readonly ["Bearer"];
                };
                readonly expires_in: {
                    readonly type: "integer";
                    readonly default: 0;
                    readonly examples: readonly [36000];
                };
                readonly scope: {
                    readonly type: "string";
                    readonly examples: readonly ["read write"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["unsupported_grant_type"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly error: {
                    readonly type: "string";
                    readonly examples: readonly ["invalid_client"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetAPaymentRequest1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["id"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly Authorization: {
                    readonly type: "string";
                    readonly default: "Bearer <your-token>";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly oneOf: readonly [{
                readonly title: "With Pending payment";
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                        readonly examples: readonly ["87b0425b6baf4012a3abd1b6f4644741"];
                    };
                    readonly user: {
                        readonly type: "string";
                        readonly examples: readonly ["https://api.instamojo.com/v2/users/60d40901b01044c8a3eaaa4d40fb04d2/"];
                    };
                    readonly phone: {
                        readonly type: "string";
                        readonly examples: readonly ["+919898989898"];
                    };
                    readonly email: {
                        readonly type: "string";
                        readonly examples: readonly ["rahul.sharma@instamojo.com"];
                    };
                    readonly buyer_name: {
                        readonly type: "string";
                        readonly examples: readonly ["Rahul"];
                    };
                    readonly amount: {
                        readonly type: "string";
                        readonly examples: readonly ["10.00"];
                    };
                    readonly purpose: {
                        readonly type: "string";
                        readonly examples: readonly ["Fifa 10"];
                    };
                    readonly status: {
                        readonly type: "string";
                        readonly examples: readonly ["Pending"];
                    };
                    readonly payments: {
                        readonly type: "array";
                        readonly items: {};
                    };
                    readonly send_sms: {
                        readonly type: "boolean";
                        readonly default: true;
                        readonly examples: readonly [false];
                    };
                    readonly send_email: {
                        readonly type: "boolean";
                        readonly default: true;
                        readonly examples: readonly [false];
                    };
                    readonly sms_status: {};
                    readonly email_status: {};
                    readonly shorturl: {
                        readonly type: "string";
                        readonly examples: readonly ["https://imjo.in/AnhTM2"];
                    };
                    readonly longurl: {
                        readonly type: "string";
                        readonly examples: readonly ["https://www.instamojo.com/@rahulinstamojo/87b0425b6baf4012a3abd1b6f4644741"];
                    };
                    readonly redirect_url: {
                        readonly type: "string";
                        readonly examples: readonly ["https://www.google.com/"];
                    };
                    readonly webhook: {
                        readonly type: "string";
                        readonly examples: readonly ["https://webhook.site/bb97ae83-a108-4c27-89b7-f2387ab95a6b"];
                    };
                    readonly scheduled_at: {};
                    readonly expires_at: {};
                    readonly allow_repeated_payments: {
                        readonly type: "boolean";
                        readonly default: true;
                        readonly examples: readonly [false];
                    };
                    readonly mark_fulfilled: {
                        readonly type: "boolean";
                        readonly default: true;
                        readonly examples: readonly [false];
                    };
                    readonly created_at: {
                        readonly type: "string";
                        readonly examples: readonly ["2023-02-07T06:51:39.026489Z"];
                    };
                    readonly modified_at: {
                        readonly type: "string";
                        readonly examples: readonly ["2023-02-07T06:51:39.171672Z"];
                    };
                    readonly resource_uri: {
                        readonly type: "string";
                        readonly examples: readonly ["https://api.instamojo.com/v2/payment_requests/87b0425b6baf4012a3abd1b6f4644741/"];
                    };
                };
            }, {
                readonly title: "With Completed Payment";
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                        readonly examples: readonly ["87b0425b6baf4012a3abd1b6f4644741"];
                    };
                    readonly user: {
                        readonly type: "string";
                        readonly examples: readonly ["https://api.instamojo.com/v2/users/60d40901b01044c8a3eaaa4d40fb04d2/"];
                    };
                    readonly phone: {
                        readonly type: "string";
                        readonly examples: readonly ["+919898989898"];
                    };
                    readonly email: {
                        readonly type: "string";
                        readonly examples: readonly ["rahul.sharma@instamojo.com"];
                    };
                    readonly buyer_name: {
                        readonly type: "string";
                        readonly examples: readonly ["Rahul"];
                    };
                    readonly amount: {
                        readonly type: "string";
                        readonly examples: readonly ["10.00"];
                    };
                    readonly purpose: {
                        readonly type: "string";
                        readonly examples: readonly ["Fifa 10"];
                    };
                    readonly status: {
                        readonly type: "string";
                        readonly examples: readonly ["Completed"];
                    };
                    readonly payments: {
                        readonly type: "array";
                        readonly items: {
                            readonly type: "string";
                            readonly examples: readonly ["https://api.instamojo.com/v2/payments/MOJO3207K05Q80978898/"];
                        };
                    };
                    readonly send_sms: {
                        readonly type: "boolean";
                        readonly default: true;
                        readonly examples: readonly [false];
                    };
                    readonly send_email: {
                        readonly type: "boolean";
                        readonly default: true;
                        readonly examples: readonly [false];
                    };
                    readonly sms_status: {};
                    readonly email_status: {};
                    readonly shorturl: {
                        readonly type: "string";
                        readonly examples: readonly ["https://imjo.in/bdEqE5"];
                    };
                    readonly longurl: {
                        readonly type: "string";
                        readonly examples: readonly ["https://www.instamojo.com/@rahulinstamojo/87b0425b6baf4012a3abd1b6f4644741"];
                    };
                    readonly redirect_url: {
                        readonly type: "string";
                        readonly examples: readonly ["https://www.google.com/"];
                    };
                    readonly webhook: {
                        readonly type: "string";
                        readonly examples: readonly ["https://webhook.site/bb97ae83-a108-4c27-89b7-f2387ab95a6b"];
                    };
                    readonly scheduled_at: {};
                    readonly expires_at: {};
                    readonly allow_repeated_payments: {
                        readonly type: "boolean";
                        readonly default: true;
                        readonly examples: readonly [false];
                    };
                    readonly mark_fulfilled: {
                        readonly type: "boolean";
                        readonly default: true;
                        readonly examples: readonly [false];
                    };
                    readonly created_at: {
                        readonly type: "string";
                        readonly examples: readonly ["2023-02-07T06:49:07.209707Z"];
                    };
                    readonly modified_at: {
                        readonly type: "string";
                        readonly examples: readonly ["2023-02-07T06:50:50.349715Z"];
                    };
                    readonly resource_uri: {
                        readonly type: "string";
                        readonly examples: readonly ["https://api.instamojo.com/v2/payment_requests/87b0425b6baf4012a3abd1b6f4644741/"];
                    };
                };
            }];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Authentication credentials were not provided."];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetDetailsOfARefund1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "ID of the refund";
                };
            };
            readonly required: readonly ["id"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly Authorization: {
                    readonly type: "string";
                    readonly default: "Bearer <your-token>";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly examples: readonly ["C5c0751272"];
                };
                readonly created_by: {};
                readonly payment: {
                    readonly type: "string";
                    readonly examples: readonly ["https://api.instamojo.com/v2/payments/MOJO5a06005J21512197/"];
                };
                readonly status: {
                    readonly type: "string";
                    readonly examples: readonly ["FINI"];
                };
                readonly resolution_status: {
                    readonly type: "string";
                    readonly examples: readonly ["FINI_CONC"];
                };
                readonly status_text: {
                    readonly type: "string";
                    readonly examples: readonly ["Refunded"];
                };
                readonly type: {
                    readonly type: "string";
                    readonly examples: readonly ["QFL"];
                };
                readonly body: {
                    readonly type: "string";
                    readonly examples: readonly ["Customer isn't satisfied with the quality"];
                };
                readonly refund_amount: {
                    readonly type: "string";
                    readonly examples: readonly ["2500.00"];
                };
                readonly references: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                                readonly examples: readonly ["MOJO0a22U05M99838558"];
                            };
                            readonly type: {
                                readonly type: "string";
                                readonly examples: readonly ["Payment held."];
                            };
                            readonly created_at: {
                                readonly type: "string";
                                readonly examples: readonly ["2020-10-22T11:57:21.477161Z"];
                            };
                        };
                    };
                };
                readonly refunds: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly id: {
                                readonly type: "string";
                                readonly examples: readonly ["7ad3f73f-2a6c-4326-95e6-38381db7e969"];
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly examples: readonly ["Completed"];
                            };
                            readonly bank_reference_number: {
                                readonly type: "string";
                                readonly examples: readonly ["IGAJRIYGL4"];
                            };
                            readonly created_at: {
                                readonly type: "string";
                                readonly examples: readonly ["2020-10-22T17:07:58.272904Z"];
                            };
                        };
                    };
                };
                readonly transaction_id: {
                    readonly type: "string";
                    readonly examples: readonly ["1603367841023"];
                };
                readonly created_at: {
                    readonly type: "string";
                    readonly examples: readonly ["2020-10-22T11:57:21.410686Z"];
                };
                readonly updated_at: {
                    readonly type: "string";
                    readonly examples: readonly ["2020-10-22T17:07:58.322985Z"];
                };
                readonly resource_uri: {
                    readonly type: "string";
                    readonly examples: readonly ["https://api.instamojo.com/v2/resolutioncenter/cases/C0a2233225/"];
                };
                readonly creator_name: {
                    readonly type: "string";
                    readonly examples: readonly ["Sample seller"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Authentication credentials were not provided."];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const GetPaymentDetails1: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Payment ID";
                };
            };
            readonly required: readonly ["id"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly Authorization: {
                    readonly type: "string";
                    readonly default: "Bearer <your-token>";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly oneOf: readonly [{
                readonly title: "With Successful Payment";
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                        readonly examples: readonly ["MOJO3207U05Q80983266"];
                    };
                    readonly title: {
                        readonly type: "string";
                        readonly examples: readonly ["FIFA 10"];
                    };
                    readonly payment_type: {
                        readonly type: "string";
                        readonly examples: readonly ["api_rap"];
                    };
                    readonly payment_request: {
                        readonly type: "string";
                        readonly examples: readonly ["https://api.instamojo.com/v2/payment_requests/b318750f06e3491484acef4cb4ff7966/"];
                    };
                    readonly status: {
                        readonly type: "boolean";
                        readonly default: true;
                        readonly examples: readonly [true];
                    };
                    readonly link: {};
                    readonly product: {};
                    readonly seller: {
                        readonly type: "string";
                        readonly examples: readonly ["https://api.instamojo.com/v2/users/60d40901b01044c8a3eaaa4d40fb04d2/"];
                    };
                    readonly currency: {
                        readonly type: "string";
                        readonly examples: readonly ["INR"];
                    };
                    readonly amount: {
                        readonly type: "string";
                        readonly examples: readonly ["10.00"];
                    };
                    readonly name: {
                        readonly type: "string";
                        readonly examples: readonly ["Rahul"];
                    };
                    readonly email: {
                        readonly type: "string";
                        readonly examples: readonly ["rahul.sharma@instamojo.com"];
                    };
                    readonly phone: {
                        readonly type: "string";
                        readonly examples: readonly ["+919898989898"];
                    };
                    readonly payout: {};
                    readonly fees: {
                        readonly type: "string";
                        readonly examples: readonly ["3.20"];
                    };
                    readonly total_taxes: {
                        readonly type: "string";
                        readonly examples: readonly ["0.58"];
                    };
                    readonly cases: {
                        readonly type: "array";
                        readonly items: {};
                    };
                    readonly affiliate_id: {};
                    readonly affiliate_commission: {
                        readonly type: "string";
                        readonly examples: readonly ["0.00"];
                    };
                    readonly order_info: {
                        readonly type: "object";
                        readonly properties: {
                            readonly shipping_address: {};
                            readonly shipping_city: {};
                            readonly shipping_state: {};
                            readonly shipping_zip: {};
                            readonly shipping_country: {};
                            readonly quantity: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [1];
                            };
                            readonly unit_price: {
                                readonly type: "string";
                                readonly examples: readonly ["10.00"];
                            };
                            readonly custom_fields: {
                                readonly type: "object";
                                readonly properties: {};
                            };
                            readonly variants: {
                                readonly type: "array";
                                readonly items: {};
                            };
                        };
                    };
                    readonly instrument_type: {
                        readonly type: "string";
                        readonly examples: readonly ["QR"];
                    };
                    readonly billing_instrument: {
                        readonly type: "string";
                        readonly examples: readonly ["Order based QR Code"];
                    };
                    readonly failure: {};
                    readonly created_at: {
                        readonly type: "string";
                        readonly examples: readonly ["2023-02-07T08:30:33.902672Z"];
                    };
                    readonly updated_at: {
                        readonly type: "string";
                        readonly examples: readonly ["2023-02-07T08:30:34.300356Z"];
                    };
                    readonly tax_invoice_id: {
                        readonly type: "string";
                        readonly examples: readonly [""];
                    };
                    readonly resource_uri: {
                        readonly type: "string";
                        readonly examples: readonly ["https://api.instamojo.com/v2/payments/MOJO3207U05Q80983266/"];
                    };
                };
            }, {
                readonly title: "With Failed Payment";
                readonly type: "object";
                readonly properties: {
                    readonly id: {
                        readonly type: "string";
                        readonly examples: readonly ["MOJO3209V05A98786622"];
                    };
                    readonly title: {
                        readonly type: "string";
                        readonly examples: readonly ["Fifa 10"];
                    };
                    readonly payment_type: {
                        readonly type: "string";
                        readonly examples: readonly ["api_rap"];
                    };
                    readonly payment_request: {
                        readonly type: "string";
                        readonly examples: readonly ["https://api.instamojo.com/v2/payment_requests/83eb2693763349d891bd1d58b14cea1c/"];
                    };
                    readonly status: {
                        readonly type: "boolean";
                        readonly default: true;
                        readonly examples: readonly [false];
                    };
                    readonly link: {};
                    readonly product: {};
                    readonly seller: {
                        readonly type: "string";
                        readonly examples: readonly ["https://api.instamojo.com/v2/users/60d40901b01044c8a3eaaa4d40fb04d2/"];
                    };
                    readonly currency: {
                        readonly type: "string";
                        readonly examples: readonly ["INR"];
                    };
                    readonly amount: {
                        readonly type: "string";
                        readonly examples: readonly ["10.00"];
                    };
                    readonly name: {
                        readonly type: "string";
                        readonly examples: readonly ["Rahul"];
                    };
                    readonly email: {
                        readonly type: "string";
                        readonly examples: readonly ["rahul.sharma@instamojo.com"];
                    };
                    readonly phone: {
                        readonly type: "string";
                        readonly examples: readonly ["+919898989898"];
                    };
                    readonly payout: {};
                    readonly fees: {};
                    readonly total_taxes: {};
                    readonly cases: {
                        readonly type: "array";
                        readonly items: {};
                    };
                    readonly affiliate_id: {};
                    readonly affiliate_commission: {};
                    readonly order_info: {
                        readonly type: "object";
                        readonly properties: {
                            readonly shipping_address: {};
                            readonly shipping_city: {};
                            readonly shipping_state: {};
                            readonly shipping_zip: {};
                            readonly shipping_country: {};
                            readonly quantity: {
                                readonly type: "integer";
                                readonly default: 0;
                                readonly examples: readonly [1];
                            };
                            readonly unit_price: {
                                readonly type: "string";
                                readonly examples: readonly ["10.00"];
                            };
                            readonly custom_fields: {
                                readonly type: "object";
                                readonly properties: {};
                            };
                            readonly variants: {
                                readonly type: "array";
                                readonly items: {};
                            };
                        };
                    };
                    readonly instrument_type: {
                        readonly type: "string";
                        readonly examples: readonly ["CARD"];
                    };
                    readonly billing_instrument: {
                        readonly type: "string";
                        readonly examples: readonly ["International Regular Credit Card (Visa/Mastercard)"];
                    };
                    readonly failure: {
                        readonly type: "object";
                        readonly properties: {
                            readonly reason: {
                                readonly type: "string";
                                readonly examples: readonly ["AUTHORIZATION_FAILED"];
                            };
                            readonly message: {
                                readonly type: "string";
                                readonly examples: readonly ["Transaction was declined by the bank"];
                            };
                        };
                    };
                    readonly created_at: {
                        readonly type: "string";
                        readonly examples: readonly ["2023-02-09T07:35:56.590046Z"];
                    };
                    readonly updated_at: {
                        readonly type: "string";
                        readonly examples: readonly ["2023-02-09T07:36:04.285084Z"];
                    };
                    readonly tax_invoice_id: {
                        readonly type: "string";
                        readonly examples: readonly [""];
                    };
                    readonly resource_uri: {
                        readonly type: "string";
                        readonly examples: readonly ["https://api.instamojo.com/v2/payments/MOJO3209V05A98786622/"];
                    };
                };
            }];
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Authentication credentials were not provided."];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const ListingVirtualAccounts: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly page: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "If the response spans multiple pages, the page parameter can be used to get paginated response";
                };
                readonly limit: {
                    readonly type: "integer";
                    readonly format: "int32";
                    readonly minimum: -2147483648;
                    readonly maximum: 2147483647;
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                    readonly description: "Number of records returned in the response can be controlled with limit parameter.";
                };
            };
            readonly required: readonly [];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {};
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const Signup: {
    readonly formData: {
        readonly type: "object";
        readonly required: readonly ["email", "password", "phone", "referrer"];
        readonly properties: {
            readonly email: {
                readonly type: "string";
                readonly description: "Email id for the account.";
            };
            readonly password: {
                readonly type: "string";
                readonly description: "The password for the account.";
            };
            readonly phone: {
                readonly type: "string";
                readonly description: "Phone number for the account";
            };
            readonly referrer: {
                readonly type: "string";
                readonly description: "The referrer provided to you.";
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly examples: readonly ["90f01dfdacbe4fe7892fc27dbdc30906"];
                };
                readonly username: {
                    readonly type: "string";
                    readonly examples: readonly ["foo"];
                };
                readonly email: {
                    readonly type: "string";
                    readonly examples: readonly ["foo@example.com"];
                };
                readonly phone: {
                    readonly type: "string";
                    readonly examples: readonly ["+919988776655"];
                };
                readonly resource_uri: {
                    readonly type: "string";
                    readonly examples: readonly ["https://api.instamojo.com/v2/users/90f01dfdacbe4fe7892fc27dbdc30906/"];
                };
                readonly promo_code: {};
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly username: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["Username is not available."];
                    };
                };
                readonly email: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["Email already exists."];
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Authentication credentials were not provided."];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const UpdateBankDetailsOfAUser: {
    readonly formData: {
        readonly type: "object";
        readonly required: readonly ["account_holder_name", "account_number", "ifsc_code"];
        readonly properties: {
            readonly account_holder_name: {
                readonly type: "string";
                readonly description: "Name of account holder.";
            };
            readonly account_number: {
                readonly type: "string";
                readonly description: "Bank account number.";
            };
            readonly ifsc_code: {
                readonly type: "string";
                readonly description: "IFSC code of the branch.";
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly user: {
                    readonly type: "string";
                    readonly examples: readonly ["https://api.instamojo.com/v2/users/90f01dfdacbe4fe7892fc27dbdc30906/"];
                };
                readonly account_holder_name: {
                    readonly type: "string";
                    readonly examples: readonly ["Foo Bar"];
                };
                readonly bank_name: {
                    readonly type: "string";
                    readonly examples: readonly [""];
                };
                readonly account_number: {
                    readonly type: "string";
                    readonly examples: readonly ["123456789"];
                };
                readonly ifsc_code: {
                    readonly type: "string";
                    readonly examples: readonly ["SBIN0000111"];
                };
                readonly updated_at: {
                    readonly type: "string";
                    readonly examples: readonly ["2016-05-09T15:40:50.715Z"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly ifsc_code: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["This field is required."];
                    };
                };
                readonly account_holder_name: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["This field is required."];
                    };
                };
                readonly account_number: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["This field is required."];
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Authentication credentials were not provided."];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "404": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Not found"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
declare const UpdateDetailsOfAUser: {
    readonly formData: {
        readonly type: "object";
        readonly properties: {
            readonly first_name: {
                readonly type: "string";
                readonly description: "First name of the account.";
            };
            readonly last_name: {
                readonly type: "string";
                readonly description: "Last name of the account.";
            };
            readonly location: {
                readonly type: "string";
                readonly description: "Location of the user.";
            };
            readonly phone: {
                readonly type: "string";
                readonly description: "Phone number of the user.";
            };
        };
        readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
                };
            };
            readonly required: readonly ["id"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly id: {
                    readonly type: "string";
                    readonly examples: readonly ["90f01dfdacbe4fe7892fc27dbdc30906"];
                };
                readonly username: {
                    readonly type: "string";
                    readonly examples: readonly ["foo"];
                };
                readonly first_name: {
                    readonly type: "string";
                    readonly examples: readonly ["Foo"];
                };
                readonly last_name: {
                    readonly type: "string";
                    readonly examples: readonly ["Bar"];
                };
                readonly phone: {
                    readonly type: "string";
                    readonly examples: readonly ["+919988776655"];
                };
                readonly email: {
                    readonly type: "string";
                    readonly examples: readonly ["foo@example.com"];
                };
                readonly date_joined: {
                    readonly type: "string";
                    readonly examples: readonly ["2016-05-09T15:08:29.060Z"];
                };
                readonly is_email_verified: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly is_phone_verified: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly bio: {
                    readonly type: "string";
                    readonly examples: readonly [""];
                };
                readonly location: {
                    readonly type: "string";
                    readonly examples: readonly ["India"];
                };
                readonly public_phone: {};
                readonly public_email: {};
                readonly public_website: {};
                readonly avatar_image_url: {};
                readonly profile_image_url: {};
                readonly tags: {
                    readonly type: "array";
                    readonly items: {};
                };
                readonly resource_uri: {
                    readonly type: "string";
                    readonly examples: readonly ["https://api.instamojo.com/v2/users/90f01dfdacbe4fe7892fc27dbdc30906/"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "400": {
            readonly type: "object";
            readonly properties: {
                readonly phone: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly examples: readonly ["Enter a valid phone number"];
                    };
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "401": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Authentication credentials were not provided."];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
        readonly "404": {
            readonly type: "object";
            readonly properties: {
                readonly success: {
                    readonly type: "boolean";
                    readonly default: true;
                    readonly examples: readonly [false];
                };
                readonly message: {
                    readonly type: "string";
                    readonly examples: readonly ["Not found"];
                };
            };
            readonly $schema: "https://json-schema.org/draft/2020-12/schema#";
        };
    };
};
export { CreateAPaymentRequest1, CreateARefund1, CreateAnOrderUsingPaymentRequestId1, CreatingVirtualAccounts, DisableARequest, EnableARequest, FulfilAPayment, GenerateAccessTokenApplicationBasedAuthentication, GetAPaymentRequest1, GetDetailsOfARefund1, GetPaymentDetails1, ListingVirtualAccounts, Signup, UpdateBankDetailsOfAUser, UpdateDetailsOfAUser };
