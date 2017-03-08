
    define('modules/models-checkout',[
        'modules/jquery-mozu',
        'underscore',
        'hyprlive',
        'modules/backbone-mozu',
        'modules/api',
        'modules/models-customer',
        'modules/models-address',
        'modules/models-paymentmethods',
        'hyprlivecontext'
    ],  
        function ($, _, Hypr, Backbone, api, CustomerModels, AddressModels, PaymentMethods, HyprLiveContext) {
           
            var CheckoutStep = Backbone.MozuModel.extend({
            helpers: ['stepStatus', 'requiresFulfillmentInfo','isAwsCheckout','isNonMozuCheckout', 'requiresDigitalFulfillmentContact', 'isShippingEditHidden'],  //
                // instead of overriding constructor, we are creating
                // a method that only the CheckoutStepView knows to
                // run, so it can run late enough for the parent
                // reference in .getOrder to exist;
                initStep: function () {
                    var me = this;
                    this.next = (function(next) {
                        return _.debounce(function() {
                            if (!me.isLoading()) next.call(me);
                        }, 750, true);
                    })(this.next);
                    var order = me.getOrder();
                    me.calculateStepStatus();
                    me.listenTo(order, 'error', function () {
                        if (me.isLoading()) {
                            me.isLoading(false);
                        }
                    });
                    me.set('orderId', order.id);
                    if (me.apiModel) me.apiModel.on('action', function (name, data) {
                        if (data) {
                            data.orderId = order.id;
                        } else {
                            me.apiModel.prop('orderId', order.id);
                        }
                    });
                },
                calculateStepStatus: function () {
                    // override this!
                    var newStepStatus = this.isValid(!this.stepStatus()) ? 'complete' : 'invalid';
                    return this.stepStatus(newStepStatus);
                },
                getOrder: function () {
                    return this.parent;
                },
                stepStatus: function (newStatus) {
                    if (arguments.length > 0) {
                        this._stepStatus = newStatus;
                        this.trigger('stepstatuschange', newStatus);
                    }
                    return this._stepStatus;
                },
                requiresFulfillmentInfo: function () {
                    return this.getOrder().get('requiresFulfillmentInfo');
                },
                isNonMozuCheckout: function() {
                    var activePayments = this.getOrder().apiModel.getActivePayments();
                    if (activePayments && activePayments.length === 0) return false;
                return (activePayments && (_.findWhere(activePayments, { paymentType: 'PayWithAmazon' }) || _.findWhere(activePayments, { paymentType: 'PayPalExpress2' })));
                },
                isAwsCheckout: function() {
                    var activePayments = this.getOrder().apiModel.getActivePayments();
                    return activePayments && !!_.findWhere(activePayments, { paymentType: 'PayWithAmazon' });
                },
                isShippingEditHidden: function() {
                  if (HyprLiveContext.locals.themeSettings.changeShipping) return false;
    
                  return this.isNonMozuCheckout();
                 },
                requiresDigitalFulfillmentContact: function () {
                    return this.getOrder().get('requiresDigitalFulfillmentContact');
                },
                edit: function () {
                    this.stepStatus('incomplete');
                },
                next: function () { 
                    if (this.submit()) this.isLoading(true); 
                }
            }),
    
            FulfillmentContact = CheckoutStep.extend({
                relations: CustomerModels.Contact.prototype.relations,
                validation: CustomerModels.Contact.prototype.validation,
                digitalOnlyValidation: {
                    'email': {
                        pattern: 'email',
                        msg: Hypr.getLabel('emailMissing')
                    } 
                },
                dataTypes: {
                    contactId: function(val) {
                        return (val === 'new') ? val : Backbone.MozuModel.DataTypes.Int(val);
                    }
                },
                helpers: ['contacts'],
                contacts: function () {
                    var contacts = this.getOrder().get('customer').get('contacts').toJSON();
                    return contacts && contacts.length > 0 && contacts;
                },
                initialize: function () {
                    var self = this;
                    this.on('change:contactId', function (model, newContactId) {
                        if (!newContactId || newContactId === 'new') {
                            model.get('address').clear();
                            model.get('phoneNumbers').clear();
                            model.unset('id');
                            model.unset('firstName');
                            model.unset('lastNameOrSurname');
                        model.unset('companyOrOrganization');
                        } else {
                            model.set(model.getOrder().get('customer').get('contacts').get(newContactId).toJSON(), {silent: true});
                        }
                    });
                },
                calculateStepStatus: function () {
                    if (!this.requiresFulfillmentInfo() && this.requiresDigitalFulfillmentContact()) {
                        this.validation = this.digitalOnlyValidation;
                    }
    
                    if (!this.requiresFulfillmentInfo() && !this.requiresDigitalFulfillmentContact()) return this.stepStatus('complete');
                    return CheckoutStep.prototype.calculateStepStatus.apply(this);
                },
                getOrder: function () {
                    // since this is one step further away from the order, it has to be accessed differently
                    return this.parent.parent;
                },
                choose: function (e) {
                    var idx = parseInt($(e.currentTarget).val(), 10);
                    if (idx !== -1) {
                        var addr = this.get('address');
                        var valAddr = addr.get('candidateValidatedAddresses')[idx];
                        for (var k in valAddr) {
                            addr.set(k, valAddr[k]);
                        }
                    }
                },
                toJSON: function () {
                    if (this.requiresFulfillmentInfo() || this.requiresDigitalFulfillmentContact()) {
                        return CheckoutStep.prototype.toJSON.apply(this, arguments);
                    }
                },
                isDigitalValid: function() {
                    var email = this.get('email');
                    return (!email) ? false : true;
                },
                nextDigitalOnly: function () {
                    var order = this.getOrder(),
                        me = this;
                    if (this.validate()) return false;
                    this.getOrder().apiModel.update({ fulfillmentInfo: me.toJSON() }).ensure(function () {
                        me.isLoading(false);
                        order.messages.reset();
                        order.syncApiModel();
    
                        me.calculateStepStatus();
                        return order.get('billingInfo').calculateStepStatus();
                    });
                },
                next: function () {
                    if (!this.requiresFulfillmentInfo() && this.requiresDigitalFulfillmentContact()) {
                        return this.nextDigitalOnly();
                    }
    
                    var validationObj = this.validate();
    
                    if (validationObj) { 
                        Object.keys(validationObj).forEach(function(key){
                            this.trigger('error', {message: validationObj[key]});
                        }, this);
    
                        return false;
                    }
                    if(this.get('updateshipaddress')){
                        var accid = require.mozuData("user").accountId;
                        var ss = JSON.stringify(this.attributes);
                        var virtualmod = $.parseJSON(ss);
                        if(!require.mozuData("user").isAnonymous){    
                            api.request("put","/api/commerce/customer/accounts/"+accid+"/contacts/"+virtualmod.id, virtualmod).then(function(res){
                                      
                            });
                        }     
                    }

                    if (this.get('updateMode') === 'edit') {
                                    this.set('updateMode', 'editComplete');
                      }

                   var parent = this.parent,
                        order = this.getOrder(),
                        me = this,
                        isAddressValidationEnabled = HyprLiveContext.locals.siteContext.generalSettings.isAddressValidationEnabled,
                        allowInvalidAddresses = HyprLiveContext.locals.siteContext.generalSettings.allowInvalidAddresses;
                    this.isLoading(true);
                    var addr = this.get('address');
                    var completeStep = function () {
                        order.messages.reset();
                        order.syncApiModel();
                        me.isLoading(true);
                        order.apiModel.getShippingMethodsFromContact().then(function (methods) {
                            return parent.refreshShippingMethods(methods);
                        }).ensure(function () {
                            addr.set('candidateValidatedAddresses', null);
                            me.isLoading(false);
                            parent.isLoading(false);
                            me.calculateStepStatus();
                            parent.calculateStepStatus();
                        });                  
                    };
    
                    var promptValidatedAddress = function () {
                        order.syncApiModel();
                        me.isLoading(false);
                        parent.isLoading(false);
                        me.stepStatus('invalid');
                    };
    
                    if (!isAddressValidationEnabled) {
                        completeStep();
                    } else {
                        if (!addr.get('candidateValidatedAddresses')) {
                            var methodToUse = allowInvalidAddresses ? 'validateAddressLenient' : 'validateAddress';
                            addr.apiModel[methodToUse]().then(function (resp) {
                                if (resp.data && resp.data.addressCandidates && resp.data.addressCandidates.length) {
                                    if (_.find(resp.data.addressCandidates, addr.is, addr)) {
                                        addr.set('isValidated', true);
                                            completeStep();
                                            return;
                                        }
                                    addr.set('candidateValidatedAddresses', resp.data.addressCandidates);
                                    promptValidatedAddress();
                                } else {
                                    completeStep();
                                }
                            }, function (e) {
                                if (allowInvalidAddresses) {
                                    // TODO: sink the exception.in a better way.
                                    order.messages.reset();
                                    completeStep();
                                } else {
                                    order.messages.reset({ message: Hypr.getLabel('addressValidationError') });
                                }
                            });
                        } else {
                            completeStep();
                        }
                    }
                }
            }),
    
            FulfillmentInfo = CheckoutStep.extend({
                initialize: function () {
                    var me = this;
                    this.on('change:availableShippingMethods', function (me, value) {
                        me.updateShippingMethod(me.get('shippingMethodCode'), true);
                    });
                    _.defer(function () {
                        // This adds the price and other metadata off the chosen
                        // method to the info object itself.
                        // This can only be called after the order is loaded
                        // because the order data will impact the shipping costs.
                        me.updateShippingMethod(me.get('shippingMethodCode'), true);
                    });
                },
                relations: {
                    fulfillmentContact: FulfillmentContact
                },
                validation: {
                    shippingMethodCode: {
                        required: true,
                        msg: Hypr.getLabel('chooseShippingMethod')
                    }
                },
                refreshShippingMethods: function (methods) {
                    this.set({
                        availableShippingMethods: methods
                    });
    
                    // always make them choose again
                    _.each(['shippingMethodCode', 'shippingMethodName'], this.unset, this);
                    this.calculateStepStatus();
                    // after unset we need to select the cheapest option
                    this.updateShippingMethod();
                },
                calculateStepStatus: function () {      
                    // If no shipping required, we're done.
                    if (!this.requiresFulfillmentInfo()) return this.stepStatus('complete');
    
                    // If there's no shipping address yet, go blank.
                    if (this.get('fulfillmentContact').stepStatus() !== 'complete') {
                        return this.stepStatus('new');
                    }else{
                        return this.stepStatus('incomplete');
                    }
    
                    // Incomplete status for shipping is basically only used to show the Shipping Method's Next button,
                    // which does nothing but show the Payment Info step.
                    var billingInfo = this.parent.get('billingInfo');
                    if (!billingInfo || billingInfo.stepStatus() === 'new') return this.stepStatus('incomplete');
    
                    // Payment Info step has been initialized. Complete status hides the Shipping Method's Next button.
                    return this.stepStatus('new');  
                },
                updateShippingMethod: function (code, resetMessage) {
                    var available = this.get('availableShippingMethods'),
                        newMethod = _.findWhere(available, { shippingMethodCode: code }),
                        lowestValue = _.min(available, function(ob) { return ob.price; }); // Returns Infinity if no items in collection.
    
                    if (!newMethod && available && available.length && lowestValue) {
                        newMethod = lowestValue;
                    }
                    if (newMethod) {
                        this.set(newMethod);
                        this.applyShipping(resetMessage);
                    }
                },
                applyShipping: function(resetMessage) {
                    if (this.validate()) return false;
                    var me = this;
                    this.isLoading(true);
                    var order = this.getOrder();
                    if (order) {
                        order.apiModel.update({ fulfillmentInfo: me.toJSON() })
                            .then(function (o) {
                                var billingInfo = me.parent.get('billingInfo');
                                if (billingInfo) {
                                    billingInfo.loadCustomerDigitalCredits();
                                }
                            })
                            .ensure(function() {
                                me.isLoading(false);
                                if(me.parent.get('billingInfo').attributes.paymentType === "PayPalExpress2"){
                                    me.calculateStepStatus();
                                    me.parent.get('billingInfo').calculateStepStatus();
                                }
                                if(resetMessage) {
                                    me.parent.messages.reset(me.parent.get('messages'));
                                }
                            });
                    }
                },
                next: function () {
                    this.stepStatus('complete');
                    this.parent.get('billingInfo').calculateStepStatus();
                }
            }),
    
            BillingInfo = CheckoutStep.extend({
                mozuType: 'payment',
                validation: {
                    paymentType: {
    
                        fn: "validatePaymentType"
                    },
                    savedPaymentMethodId: {
                        fn: "validateSavedPaymentMethodId"
                    },
    
                    'billingContact.email': {
                        pattern: 'email',
                        msg: Hypr.getLabel('emailMissing')
                    }
                },
                dataTypes: {
                    'isSameBillingShippingAddress': Backbone.MozuModel.DataTypes.Boolean,
                    'creditAmountToApply': Backbone.MozuModel.DataTypes.Float
                },
                relations: {
                    billingContact: CustomerModels.Contact,
                    card: PaymentMethods.CreditCardWithCVV,
                    check: PaymentMethods.Check
                },
                validatePaymentType: function(value, attr) {
                    var order = this.getOrder();
                    var payment = order.apiModel.getCurrentPayment();
                    var errorMessage = Hypr.getLabel('paymentTypeMissing');
                    if (!value) return errorMessage;
                    if ((value === "StoreCredit" || value === "GiftCard") && this.nonStoreCreditTotal() > 0 && !payment) return errorMessage;
    
                },
                validateSavedPaymentMethodId: function (value, attr, computedState) {
                    if (this.get('usingSavedCard')) {
                        var isValid = this.get('savedPaymentMethodId');
                        if (!isValid) return Hypr.getLabel('selectASavedCard');
                    }
    
                },
                helpers: ['acceptsMarketing', 'savedPaymentMethods', 'availableStoreCredits', 'applyingCredit', 'maxCreditAmountToApply',
                  'activeStoreCredits', 'nonStoreCreditTotal', 'activePayments', 'hasSavedCardPayment', 'availableDigitalCredits', 'digitalCreditPaymentTotal', 'isAnonymousShopper', 'visaCheckoutFlowComplete','isExternalCheckoutFlowComplete', 'checkoutFlow'],
                acceptsMarketing: function () {
                    return this.getOrder().get('acceptsMarketing');
                },
                 isExternalCheckoutFlowComplete: function () {
                    return this.get('paymentWorkflow') !== "Mozu";
                },
                visaCheckoutFlowComplete: function() {
                    return this.get('paymentWorkflow') === 'VisaCheckout';
                },
                checkoutFlow: function () {
                    return this.get('paymentWorkflow');
                },
                cancelExternalCheckout: function () {
                    var self = this;
                    var order = this.getOrder();
                    var currentPayment = order.apiModel.getCurrentPayment();
                    return order.apiVoidPayment(currentPayment.id).then(function() {
                        self.clear();
                        self.stepStatus('incomplete');
                        // need to re-enable purchase order information if purchase order is available.
                       // self.setPurchaseOrderInfo();
                        // Set the defualt payment method for the customer.
                        //self.setDefaultPaymentType(self);
                    });
                },
                cancelVisaCheckout: function() {
                    var self = this;
                    var order = this.getOrder();
                    var currentPayment = order.apiModel.getCurrentPayment();
                    return order.apiVoidPayment(currentPayment.id).then(function() {
                        self.clear();
                        self.stepStatus('incomplete');
                        self.setDefaultPaymentType(self);
                    });
                },
                activePayments: function () {
                    return this.getOrder().apiModel.getActivePayments();
                },
                hasSavedCardPayment: function() {
                    var currentPayment = this.getOrder().apiModel.getCurrentPayment();
                    return !!(currentPayment && currentPayment.billingInfo.card && currentPayment.billingInfo.card.paymentServiceCardId);
                },
                nonStoreCreditTotal: function () {
                    var me = this,
                        order = this.getOrder(),
                        total = order.get('total'),
                        result,
                        activeCredits = this.activeStoreCredits();
                    if (!activeCredits) return total;
                    result = total - _.reduce(activeCredits, function (sum, credit) {
                        return sum + credit.amountRequested;
                    }, 0);
                    return me.roundToPlaces(result, 2);
                },
                resetAddressDefaults: function () {
                    var billingAddress = this.get('billingContact').get('address');
                    var addressDefaults = billingAddress.defaults;
                    billingAddress.set('countryCode', addressDefaults.countryCode);
                    billingAddress.set('addressType', addressDefaults.addressType);
                    billingAddress.set('candidateValidatedAddresses', addressDefaults.candidateValidatedAddresses);
                },
                savedPaymentMethods: function () {
                    var cards = this.getOrder().get('customer').get('cards').toJSON();
                    return cards && cards.length > 0 && cards;
                },
                activeStoreCredits: function () {
                    var active = this.getOrder().apiModel.getActiveStoreCredits();
                    return active && active.length > 0 && active;
                },
                availableStoreCredits: function () {
                    var order = this.getOrder(),
                        customer = order.get('customer'),
                        credits = customer && customer.get('credits'),
                        usedCredits = this.activeStoreCredits(),
                        availableCredits = credits && _.compact(_.map(credits.models, function (credit) {
                            if (!(credit.creditType === 'StoreCredit' || credit.creditType === 'GiftCard'))
                                return false;
                            credit = _.clone(credit);
                            if (usedCredits) _.each(usedCredits, function (uc) {
                                if (uc.billingInfo.storeCreditCode === credit.code) {
                                    credit.currentBalance -= uc.amountRequested;
                                }
                            });
                            return credit.currentBalance > 0 ? credit : false;
                        }));
                    return availableCredits && availableCredits.length > 0 && availableCredits;
                },
    
                applyingCredit: function () {
                    return this._applyingCredit;
                },
                maxCreditAmountToApply: function () {
                    var order = this.getOrder(),
                        total = order.get('amountRemainingForPayment'),
                        applyingCredit = this.applyingCredit();
                    if (applyingCredit) return Math.min(applyingCredit.currentBalance, total).toFixed(2);
                },
                beginApplyCredit: function () {
                    var selectedCredit = this.get('selectedCredit');
                    this._oldPaymentType = this.get('paymentType');
                    if (selectedCredit) {
                        var applyingCredit = _.findWhere(this.availableStoreCredits(), { code: selectedCredit });
                        if (applyingCredit) {
                            this._applyingCredit = applyingCredit;
                            this.set('creditAmountToApply', this.maxCreditAmountToApply());
                        }
                    }
                },            
                closeApplyCredit: function () {
                    delete this._applyingCredit;
                    this.unset('selectedCredit');
                    this.set('paymentType', this._oldPaymentType);
                },
                finishApplyCredit: function () {
                    var self = this,
                        order = self.getOrder();
                    return order.apiAddStoreCredit({
                        storeCreditCode: this.get('selectedCredit'),
                        amount: this.get('creditAmountToApply')
                    }).then(function (o) {
                        order.set(o.data);
                        self.closeApplyCredit();
                        return order.update();
                    });
                },
    
                // digital
    
                onCreditAmountChanged: function(digCredit, amt) {
                    this.applyDigitalCredit(digCredit.get('code'), amt);
                },
    
                loadCustomerDigitalCredits: function () {
                    var self = this,
                        order = this.getOrder(),
                        customer = order.get('customer'),
                        activeCredits = this.activeStoreCredits();
    
                    var customerCredits = customer.get('credits');
                    if (customerCredits && customerCredits.length > 0) {
                        var currentDate = new Date(),
                            unexpiredDate = new Date(2076, 6, 4);
    
                        // todo: refactor so conversion & get can re-use - Greg Murray on 2014-07-01 
                        var invalidCredits = customerCredits.filter(function(cred) {
                            var credBalance = cred.get('currentBalance'),
                                credExpDate = cred.get('expirationDate');
                            var expDate = (credExpDate) ? new Date(credExpDate) : unexpiredDate;
                            return (!credBalance || credBalance <= 0 || expDate < currentDate);
                        });
                        _.each(invalidCredits, function(inv) {
                            customerCredits.remove(inv);
                        });
                    }
                    self._cachedDigitalCredits = customerCredits;
    
                    if (activeCredits) {
                        var userEnteredCredits = _.filter(activeCredits, function(activeCred) {
                            var existingCustomerCredit = self._cachedDigitalCredits.find(function(cred) {
                                return cred.get('code').toLowerCase() === activeCred.billingInfo.storeCreditCode.toLowerCase();
                            });
                            if (!existingCustomerCredit) {
                                return true;
                            }
                            //apply pricing update.
                            existingCustomerCredit.set('isEnabled', true);
                            existingCustomerCredit.set('creditAmountApplied', activeCred.amountRequested);
                            existingCustomerCredit.set('remainingBalance', existingCustomerCredit.calculateRemainingBalance());
                            return false;
                        });
                        if (userEnteredCredits) {
                            this.convertPaymentsToDigitalCredits(userEnteredCredits, customer);
                        }
                    }
    
                },
    
                convertPaymentsToDigitalCredits: function(activeCredits, customer) {
                    var me = this;
                    _.each(activeCredits, function (activeCred) {
                        var currentCred = activeCred;
                        return me.retrieveDigitalCredit(customer, currentCred.billingInfo.storeCreditCode, me, currentCred.amountRequested).then(function(digCredit) {
                            me.trigger('orderPayment', me.getOrder().data, me);
                            return digCredit;
                        });
                    });
                },
    
                availableDigitalCredits: function () {
                    if (! this._cachedDigitalCredits) { 
                        this.loadCustomerDigitalCredits();
                    }
                    return this._cachedDigitalCredits && this._cachedDigitalCredits.length > 0 && this._cachedDigitalCredits;
                },
    
                refreshBillingInfoAfterAddingStoreCredit: function (order, updatedOrder) {
                    var self = this;
                    //clearing existing order billing info because information may have been removed (payment info) #68583
    
                    // #73389 only refresh if the payment requirement has changed after adding a store credit.
                    var activePayments = this.activePayments();
                    var hasNonStoreCreditPayment = (_.filter(activePayments, function (item) { return item.paymentType !== 'StoreCredit'; })).length > 0;
                    if ((order.get('amountRemainingForPayment') >= 0 && !hasNonStoreCreditPayment) ||
                        (order.get('amountRemainingForPayment') < 0 && hasNonStoreCreditPayment)
                        ) {
                        order.get('billingInfo').clear();
                        order.set(updatedOrder, { silent: true });
                    }
                    self.trigger('orderPayment', updatedOrder, self);
    
                },
    
                applyDigitalCredit: function (creditCode, creditAmountToApply, isEnabled) {
                    var self = this,
                        order = self.getOrder(),
                        maxCreditAvailable = null;
    
                    this._oldPaymentType = this.get('paymentType');
                    var digitalCredit = this._cachedDigitalCredits.filter(function(cred) {
                         return cred.get('code').toLowerCase() === creditCode.toLowerCase();
                    });
    
                    if (! digitalCredit || digitalCredit.length === 0) {
                        return self.deferredError(Hypr.getLabel('digitalCodeAlreadyUsed', creditCode), self);
                    }
                    digitalCredit = digitalCredit[0];
                    var previousAmount = digitalCredit.get('creditAmountApplied');
                    var previousEnabledState = digitalCredit.get('isEnabled');
    
                    if (!creditAmountToApply && creditAmountToApply !== 0) {
                        creditAmountToApply = self.getMaxCreditToApply(digitalCredit, self);
                    }
                    
                    digitalCredit.set('creditAmountApplied', creditAmountToApply);
                    digitalCredit.set('remainingBalance',  digitalCredit.calculateRemainingBalance());
                    digitalCredit.set('isEnabled', isEnabled);
    
                    //need to round to prevent being over total by .01
                    if (creditAmountToApply > 0) {
                        creditAmountToApply = self.roundToPlaces(creditAmountToApply, 2);
                    }
    
                    var activeCreditPayments = this.activeStoreCredits();
                    if (activeCreditPayments) {
                        //check if payment applied with this code, remove
                        var sameCreditPayment = _.find(activeCreditPayments, function (cred) {
                            return cred.status !== 'Voided' && cred.billingInfo && cred.billingInfo.storeCreditCode.toLowerCase() === creditCode.toLowerCase();
                        });
    
                        if (sameCreditPayment) {
                            if (this.areNumbersEqual(sameCreditPayment.amountRequested, creditAmountToApply)) {
                                var deferredSameCredit = api.defer();
                                deferredSameCredit.reject();
                                return deferredSameCredit.promise;
                            }
                            if (creditAmountToApply === 0) {
                                return order.apiVoidPayment(sameCreditPayment.id).then(function(o) {
                                    order.set(o.data);
                                    self.trigger('orderPayment', o.data, self);
                                    return o;
                                });
                            } else {
                                maxCreditAvailable = self.getMaxCreditToApply(digitalCredit, self, sameCreditPayment.amountRequested);
                                if (creditAmountToApply > maxCreditAvailable) {
                                    digitalCredit.set('creditAmountApplied', previousAmount);
                                    digitalCredit.set('isEnabled', previousEnabledState);
                                    digitalCredit.set('remainingBalance', digitalCredit.calculateRemainingBalance());
                                    return self.deferredError(Hypr.getLabel('digitalCreditExceedsBalance'), self);
                                }
                                return order.apiVoidPayment(sameCreditPayment.id).then(function (o) {
                                    order.set(o.data);
                                    
                                    return order.apiAddStoreCredit({
                                        storeCreditCode: creditCode,
                                    amount: creditAmountToApply,
                                    email: self.get('billingContact').get('email')          
                                    }).then(function (o) {
                                        self.refreshBillingInfoAfterAddingStoreCredit(order, o.data);
                                        return o;
                                    });
                                });
                            }
                        }
                    }
                    if (creditAmountToApply === 0) {
                        return this.getOrder();
                    }
    
                    maxCreditAvailable = self.getMaxCreditToApply(digitalCredit, self);
                    if (creditAmountToApply > maxCreditAvailable) {
                        digitalCredit.set('creditAmountApplied', previousAmount);
                        digitalCredit.set('remainingBalance', digitalCredit.calculateRemainingBalance());
                        digitalCredit.set('isEnabled', previousEnabledState);
                        return self.deferredError(Hypr.getLabel('digitalCreditExceedsBalance'), self);
                    }
    
                    return order.apiAddStoreCredit({
                        storeCreditCode: creditCode,
                        amount: creditAmountToApply,
                        email: self.get('billingContact').get('email')
                    }).then(function (o) {
                        self.refreshBillingInfoAfterAddingStoreCredit(order, o.data);
                        return o;
                    });
                },
    
                deferredError: function deferredError(msg, scope) {
                    scope.trigger('error', {
                        message: msg
                    });
                    var deferred = api.defer();
                    deferred.reject();
    
                    return deferred.promise;
                },
    
                areNumbersEqual: function(f1, f2) {
                    var epsilon = 0.01; 
                    return (Math.abs(f1 - f2)) < epsilon; 
                },
    
                retrieveDigitalCredit: function (customer, creditCode, me, amountRequested) {
                    var self = this;
                    return customer.apiGetDigitalCredit(creditCode).then(function (credit) {
                        var creditModel = new PaymentMethods.DigitalCredit(credit.data);
                        creditModel.set('isTiedToCustomer', false);
    
                        var validateCredit = function() {
                            var now = new Date(),
                                activationDate = creditModel.get('activationDate') ? new Date(creditModel.get('activationDate')) : null,
                                expDate = creditModel.get('expirationDate') ? new Date(creditModel.get('expirationDate')) : null;
                            if (expDate && expDate < now) {
                                return self.deferredError(Hypr.getLabel('expiredCredit', expDate.toLocaleDateString()), self);
                            }
                            if (activationDate && activationDate > now) {
                                return self.deferredError(Hypr.getLabel('digitalCreditNotYetActive', activationDate.toLocaleDateString()), self);
                            }
                            if (!creditModel.get('currentBalance') || creditModel.get('currentBalance') <= 0) {
                                return self.deferredError(Hypr.getLabel('digitalCreditNoRemainingFunds'), self);
                            }
                            return null;
                        };
    
                        var validate = validateCredit();
                        if (validate !== null) {
                            return null;
                        }
                        
                        var maxAmt = me.getMaxCreditToApply(creditModel, me, amountRequested);
                        if (!!amountRequested && amountRequested < maxAmt) {
                            maxAmt = amountRequested;
                        }
                        creditModel.set('creditAmountApplied', maxAmt);
                        creditModel.set('remainingBalance', creditModel.calculateRemainingBalance());
                        creditModel.set('isEnabled', true);
    
                        me._cachedDigitalCredits.push(creditModel);
                        me.applyDigitalCredit(creditCode, maxAmt, true);
                        me.trigger('sync', creditModel);
                        return creditModel;
                    });
                },
    
                getDigitalCredit: function () {
                    var me = this,
                        order = me.getOrder(),
                        customer = order.get('customer');
                    var creditCode = this.get('digitalCreditCode');
    
                    var existingDigitalCredit = this._cachedDigitalCredits.filter(function (cred) {
                        return cred.get('code').toLowerCase() === creditCode.toLowerCase();
                    });
                    if (existingDigitalCredit && existingDigitalCredit.length > 0){
                        me.trigger('error', {
                            message: Hypr.getLabel('digitalCodeAlreadyUsed', creditCode)
                        });
                        // to maintain promise api
                        var deferred = api.defer();
                        deferred.reject();
                        return deferred.promise;
                    }
                    me.isLoading(true);
                    return me.retrieveDigitalCredit(customer, creditCode, me).then(function() {
                        me.isLoading(false);
                        return me;
                    });
                },
    
                getMaxCreditToApply: function(creditModel, scope, toBeVoidedPayment) {
                    var remainingTotal = scope.nonStoreCreditTotal();
                    if (!!toBeVoidedPayment) {
                        remainingTotal += toBeVoidedPayment;
                    }
                    var maxAmt = remainingTotal < creditModel.get('currentBalance') ? remainingTotal : creditModel.get('currentBalance');
                    return scope.roundToPlaces(maxAmt, 2);
                },
    
                roundToPlaces: function(amt, numberOfDecimalPlaces) {
                    var transmogrifier = Math.pow(10, numberOfDecimalPlaces);
                    return Math.round(amt * transmogrifier) / transmogrifier;
                },
    
                digitalCreditPaymentTotal: function () {
                    var activeCreditPayments = this.activeStoreCredits();
                    if (!activeCreditPayments)
                        return null;
                    return _.reduce(activeCreditPayments, function (sum, credit) {
                        return sum + credit.amountRequested;
                    }, 0);
                },
    
                addRemainingCreditToCustomerAccount: function(creditCode, isEnabled) {
                    var self = this;
    
                    var digitalCredit = self._cachedDigitalCredits.find(function(credit) {
                        return credit.code.toLowerCase() === creditCode.toLowerCase();
                    });
    
                    if (!digitalCredit) {
                        return self.deferredError(Hypr.getLabel('genericNotFound'), self);
                    }
                    digitalCredit.set('addRemainderToCustomer', isEnabled);
                    return digitalCredit;
                },
    
                getDigitalCreditsToAddToCustomerAccount: function() {
                    return this._cachedDigitalCredits.where({ isEnabled: true, addRemainderToCustomer: true, isTiedToCustomer: false });
                },
    
                isAnonymousShopper: function() {
                    var order = this.getOrder(),
                        customer = order.get('customer');
                    return (!customer || !customer.id || customer.id <= 1);
                },
    
                removeCredit: function(id) {
                    var order = this.getOrder();
                    return order.apiVoidPayment(id).then(order.update);
                },
                syncPaymentMethod: function (me, newId) {
                    if (!newId || newId === 'new') {
                        me.get('billingContact').clear();
                        me.get('card').clear();
                        me.get('check').clear();
                        me.unset('paymentType');
                        me.set('usingSavedCard', false);
                    } else {
                        me.setSavedPaymentMethod(newId);
                        me.set('usingSavedCard', true);
                    }
                },
                setSavedPaymentMethod: function (newId, manualCard) {
                    var me = this,
                        customer = me.getOrder().get('customer'),
                        card = manualCard || customer.get('cards').get(newId),
                        cardBillingContact = card && customer.get('contacts').get(card.get('contactId'));
                    if (card) {
                        me.get('billingContact').set(cardBillingContact.toJSON(), { silent: true });
                        me.get('card').set(card.toJSON());
                        me.set('paymentType', 'CreditCard');
                        me.set('usingSavedCard', true);
                        if (Hypr.getThemeSetting('isCvvSuppressed')) {
                            me.get('card').set('isCvvOptional', true);
                            if (me.parent.get('amountRemainingForPayment') > 0) {
                                return me.applyPayment();
                            }
                        }
                    }
                },
                getPaymentTypeFromCurrentPayment: function () {
                    var billingInfoPaymentType = this.get('paymentType'),
                        billingInfoPaymentWorkflow = this.get('paymentWorkflow'),
                        currentPayment = this.getOrder().apiModel.getCurrentPayment(),
                        currentPaymentType = currentPayment && currentPayment.billingInfo.paymentType,
                        currentPaymentWorkflow = currentPayment && currentPayment.billingInfo.paymentWorkflow,
                        currentBillingContact = currentPayment && currentPayment.billingInfo.billingContact,
                        currentCard = currentPayment && currentPayment.billingInfo.card;
    
                    if (currentPaymentType && (currentPaymentType !== billingInfoPaymentType || currentPaymentWorkflow !== billingInfoPaymentWorkflow)) {
                        this.set('paymentType', currentPaymentType, { silent: true });
                        this.set('paymentWorkflow', currentPaymentWorkflow, { silent: true });
                        this.set('card', currentCard, { silent: true });
                        this.set('billingContact', currentBillingContact, { silent: true });
                    }
                },
                edit: function () {
                    this.getPaymentTypeFromCurrentPayment();
                    CheckoutStep.prototype.edit.apply(this, arguments);
                },
                initialize: function () {
                    var me = this;
    
                    _.defer(function () {
                        me.getPaymentTypeFromCurrentPayment();
                        var savedCardId = me.get('card.paymentServiceCardId');
                        me.set('savedPaymentMethodId', savedCardId, { silent: true });
                        me.setSavedPaymentMethod(savedCardId);
    
                        if (!savedCardId) {
                            me.setDefaultPaymentType(me);
                        }
    
                        me.on('change:usingSavedCard', function (me, yes) {
                            if (!yes) {
                                me.get('card').clear();
                                me.set('usingSavedCard', false);
                            }
                            else {
                                me.set('isSameBillingShippingAddress', false);
                                me.setSavedPaymentMethod(me.get('savedPaymentMethodId'));
                            }
                        });
                    });
                    var billingContact = this.get('billingContact');
                    this.on('change:paymentType', this.selectPaymentType);
                    this.selectPaymentType(this, this.get('paymentType'));
                    this.on('change:isSameBillingShippingAddress', function (model, wellIsIt) {
                        if (wellIsIt) {
                            billingContact.set(this.parent.get('fulfillmentInfo').get('fulfillmentContact').toJSON(), { silent: true });
                        }
                    });
                    this.on('change:savedPaymentMethodId', this.syncPaymentMethod);
                    this._cachedDigitalCredits = null;
    
                    _.bindAll(this, 'applyPayment', 'markComplete');
                },
                selectPaymentType: function(me, newPaymentType) {
                    if ((!me.changed || !me.changed.paymentWorkflow) && !me.get('paymentWorkflow')) {
                        me.set('paymentWorkflow', 'Mozu');
                    }
                    me.get('check').selected = newPaymentType === 'Check';
                    me.get('card').selected = newPaymentType === 'CreditCard';
                },
                setDefaultPaymentType: function(me) {
                    me.set('paymentType', 'CreditCard');
                    if (me.savedPaymentMethods() && me.savedPaymentMethods().length > 0) {
                        me.set('usingSavedCard', true);
                    } 
                },
                calculateStepStatus: function () {   
                    var fulfillmentComplete = this.parent.get('fulfillmentInfo').stepStatus() === 'complete',
                        activePayments = this.activePayments(),
                        thereAreActivePayments = activePayments.length > 0,
                        paymentTypeIsCard = activePayments && !!_.findWhere(activePayments, { paymentType: 'CreditCard' }),
                        paymentTypeIsPayPalNew = activePayments && !!_.findWhere(activePayments, { paymentType: 'PayPalExpress2' }),
                        balanceNotPositive = this.parent.get('amountRemainingForPayment') <= 0;
                         if (this.isNonMozuCheckout()) return this.stepStatus("complete");
     
                    if (paymentTypeIsCard && !Hypr.getThemeSetting('isCvvSuppressed')) return this.stepStatus('incomplete'); // initial state for CVV entry
    
                    if (!fulfillmentComplete) return this.stepStatus('new');
    
                    if (thereAreActivePayments && (balanceNotPositive || (this.get('paymentType') === 'PaypalExpress' && window.location.href.indexOf('PaypalExpress=complete') !== -1))) return this.stepStatus('complete');
                    return this.stepStatus('incomplete');
    
                },
                hasPaymentChanged: function(payment) {
    
                    function normalizeBillingInfos(obj) {
                        return {
                            paymentType: obj.paymentType,
                            billingContact: _.extend(_.pick(obj.billingContact,
                                'email',
                                'firstName',
                                'lastNameOrSurname',
                                'phoneNumbers'),
                            {
                                address: obj.billingContact.address ? _.pick(obj.billingContact.address, 
                                    'address1',
                                    'address2',
                                    'addressType',
                                    'cityOrTown',
                                    'countryCode',
                                    'postalOrZipCode',
                                    'stateOrProvince') : {}
                            }),
                        card: obj.card ? _.extend(_.pick(obj.card,
                                'expireMonth',
                                'expireYear',
                                'nameOnCard',
                                'isSavedCardInfo'),
                            {
                                cardType: obj.card.paymentOrCardType || obj.card.cardType,
                                cardNumber: obj.card.cardNumberPartOrMask || obj.card.cardNumberPart || obj.card.cardNumber,
                                id: obj.card.paymentServiceCardId || obj.card.id,
                                isCardInfoSaved: obj.card.isCardInfoSaved || false
                        }) : {},
                            check: obj.check || {}
                        };
                    }
    
                    var normalizedSavedPaymentInfo = normalizeBillingInfos(payment.billingInfo);
                    var normalizedLiveBillingInfo = normalizeBillingInfos(this.toJSON());
    
                    if (payment.paymentWorkflow === 'VisaCheckout') {
                        normalizedLiveBillingInfo.billingContact.address.addressType = normalizedSavedPaymentInfo.billingContact.address.addressType;
                    }
                    
                    return !_.isEqual(normalizedSavedPaymentInfo, normalizedLiveBillingInfo);
                },
                submit: function () {
                    
                    var order = this.getOrder();
                    // just can't sync these emails right
                    order.syncBillingAndCustomerEmail();
    
                    // This needs to be ahead of validation so we can check if visa checkout is being used.
                    var currentPayment = order.apiModel.getCurrentPayment();
    
                    // the card needs to know if this is a saved card or not.
                    this.get('card').set('isSavedCard', order.get('billingInfo.usingSavedCard'));
                    // the card needs to know if this is Visa checkout (or Amazon? TBD)
                    if (currentPayment) {
                        this.get('card').set('isVisaCheckout', currentPayment.paymentWorkflow.toLowerCase() === 'visacheckout');
                    }
    
                    var val = this.validate();
    
                    if (this.nonStoreCreditTotal() > 0 && val) {
                        // display errors:
                        var error = {"items":[]};
                        for (var key in val) {
                            if (val.hasOwnProperty(key)) {
                                var errorItem = {};
                                errorItem.name = key;
                                errorItem.message = key.substring(0, ".") + val[key];
                                error.items.push(errorItem);
                            }
                        }
                        if (error.items.length > 0) {
                            order.onCheckoutError(error);
                        }
                        return false;
                    }
    
                    var card = this.get('card');
    
                    if (!currentPayment) {
                        return this.applyPayment();
                    } else if (this.hasPaymentChanged(currentPayment)) {
                        return order.apiVoidPayment(currentPayment.id).then(this.applyPayment);
                    } else if (card.get('cvv') && card.get('paymentServiceCardId')) {
                        return card.apiSave().then(this.markComplete, order.onCheckoutError);
                    } else {
                        this.markComplete();
                    }
                },
                applyPayment: function () {
                    var self = this, order = this.getOrder();
                if (this.get("paymentWorkflow") == "PayWithAmazon")
                    this.unset("paymentWorkflow");
                    this.syncApiModel();
                    if (this.nonStoreCreditTotal() > 0) {
                        return order.apiAddPayment().then(function() {
                            var payment = order.apiModel.getCurrentPayment();
                            var modelCard, modelCvv;
                            var activePayments = order.apiModel.getActivePayments();
                            var creditCardPayment = activePayments && _.findWhere(activePayments, { paymentType: 'CreditCard' });
                            //Clear card if no credit card payments exists
                            if (!creditCardPayment && self.get('card')) {
                                self.get('card').clear();
                            }
                            if (payment) {
                                switch (payment.paymentType) {
                                    case 'CreditCard':
                                        modelCard = self.get('card');
                                        modelCvv = modelCard.get('cvv');
                                        if (
                                            modelCvv && modelCvv.indexOf('*') === -1 // CVV exists and is not masked
                                        ) {
                                            modelCard.set('cvv', '***');
                                            // to hide CVV once it has been sent to the paymentservice
                                        }
    
                                        self.markComplete();
                                        break;
                                    default:
                                        self.markComplete();
                                }
                            }
                        });
                    } else {
                        this.markComplete();
                    }
                },
                markComplete: function () {
                    this.stepStatus('complete');
                    this.isLoading(false);
                    var order = this.getOrder();
                    _.defer(function() {
                        order.isReady(true);    
                    });
                    
                },
                toJSON: function(options) {
                    var j = CheckoutStep.prototype.toJSON.apply(this, arguments), loggedInEmail;
                    if (this.nonStoreCreditTotal() === 0 && j.billingContact) {
                        delete j.billingContact.address;
                    }
                    if (j.billingContact && !j.billingContact.email) {
                        j.billingContact.email = this.getOrder().get('customer.emailAddress');
                    }
                    return j;
                }
            });
    
            var ShopperNotes = Backbone.MozuModel.extend(),
    
            checkoutPageValidation = {
                'emailAddress': {
                    fn: function (value) {
                        if (this.attributes.createAccount && (!value || !value.match(Backbone.Validation.patterns.email))) return Hypr.getLabel('emailMissing');
                    }
                },
                'password': {
                    fn: function (value) {
                        if (this.attributes.createAccount && !value) return Hypr.getLabel('passwordMissing');
                    }
                },
                'confirmPassword': {
                    fn: function (value) {
                        if (this.attributes.createAccount && value !== this.get('password')) return Hypr.getLabel('passwordsDoNotMatch');
                    }
                }
            };
    
            if (Hypr.getThemeSetting('requireCheckoutAgreeToTerms')) {
                checkoutPageValidation.agreeToTerms = {
                    acceptance: true,
                    msg: Hypr.getLabel('didNotAgreeToTerms')
                };
            }
    
            var CheckoutPage = Backbone.MozuModel.extend({
                mozuType: 'order',
                handlesMessages: true,
                relations: {
                    fulfillmentInfo: FulfillmentInfo,
                    billingInfo: BillingInfo,
                    shopperNotes: ShopperNotes,
                    customer: CustomerModels.Customer
                },
                validation: checkoutPageValidation,
                dataTypes: {
                    createAccount: Backbone.MozuModel.DataTypes.Boolean,
                    acceptsMarketing: Backbone.MozuModel.DataTypes.Boolean,
                    amountRemainingForPayment: Backbone.MozuModel.DataTypes.Float
                },
                initialize: function (data) {
    
                    var self = this,
                        user = require.mozuData('user');
    
                    _.defer(function() {
                        var latestPayment = self.apiModel.getCurrentPayment(),
                            activePayments = self.apiModel.getActivePayments(),
                            fulfillmentInfo = self.get('fulfillmentInfo'),
                            fulfillmentContact = fulfillmentInfo.get('fulfillmentContact'),
                            billingInfo = self.get('billingInfo'),
                            steps = [fulfillmentInfo, fulfillmentContact, billingInfo],
                            paymentWorkflow = latestPayment && latestPayment.paymentWorkflow,
                            visaCheckoutPayment = activePayments && _.findWhere(activePayments, { paymentWorkflow: 'VisaCheckout' }),
                            allStepsComplete = function () {
                                return _.reduce(steps, function(m, i) { return m + i.stepStatus(); }, '') === 'completecompletecomplete';
                            },
                            isReady = allStepsComplete();
    
                        //Visa checkout payments can be added to order without UIs knowledge. This evaluates and voids the required payments.
                        if (visaCheckoutPayment) {
                            _.each(_.filter(self.apiModel.getActivePayments(), function (payment) {
                                return payment.paymentType !== 'StoreCredit' && payment.paymentType !== 'GiftCard' && payment.paymentWorkflow != 'VisaCheckout';
                            }), function (payment) {
                                self.apiVoidPayment(payment.id);
                            });
                            paymentWorkflow = visaCheckoutPayment.paymentWorkflow;
                            billingInfo.unset('billingContact');
                            billingInfo.set('card', visaCheckoutPayment.billingInfo.card);
                            billingInfo.set('billingContact', visaCheckoutPayment.billingInfo.billingContact, { silent:true });
                         }
    
                        if (paymentWorkflow) {
                            billingInfo.set('paymentWorkflow', paymentWorkflow);
                            billingInfo.get('card').set({
                                isCvvOptional: Hypr.getThemeSetting('isCvvSuppressed'),
                                paymentWorkflow: paymentWorkflow
                            });
                            billingInfo.trigger('stepstatuschange'); // trigger a rerender
                        }
    
                        self.isReady(isReady);
    
                        _.each(steps, function(step) {
                            self.listenTo(step, 'stepstatuschange', function() {
                                _.defer(function() {
                                    self.isReady(allStepsComplete());
                                });
                            });
                        });
    
                        if (!self.get('requiresFulfillmentInfo')) {
                            self.validation = _.pick(self.constructor.prototype.validation, _.filter(_.keys(self.constructor.prototype.validation), function(k) { return k.indexOf('fulfillment') === -1; }));
                        }
    
                        self.get('billingInfo.billingContact').on('change:email', function(model, newVal) {
                            self.set('email', newVal);
                        });
    
                        var billingEmail = billingInfo.get('billingContact.email');
                        if (!billingEmail && user.email) billingInfo.set('billingContact.email', user.email);
    
                    });
                    if (user.isAuthenticated) {
                        this.set('customer', { id: user.accountId });
                    }
                    // preloaded JSON has this as null if it's unset, which defeats the defaults collection in backbone
                    if (data.acceptsMarketing === null) {
                        self.set('acceptsMarketing', true);
                    }
                    _.bindAll(this, 'update', 'onCheckoutSuccess', 'onCheckoutError', 'addNewCustomer', 'saveCustomerCard',/* 'finalPaymentReconcile', */'apiCheckout', 'addDigitalCreditToCustomerAccount', 'addCustomerContact', 'addBillingContact', 'addShippingContact', 'addShippingAndBillingContact');
    
                },
                processDigitalWallet: function(digitalWalletType, payment) {
                    var me = this;
                    me.runForAllSteps(function() {
                        this.isLoading(true);
                    });
                    me.trigger('beforerefresh');
                    // void active payments; if there are none then the promise will resolve immediately
                    return api.all.apply(api, _.map(_.filter(me.apiModel.getActivePayments(), function(payment) {
                        return payment.paymentType !== 'StoreCredit' && payment.paymentType !== 'GiftCard';
                    }), function(payment) {
                        return me.apiVoidPayment(payment.id);
                    })).then(function() {
                        return me.apiProcessDigitalWallet({
                            digitalWalletData: JSON.stringify(payment)
                        }).then(function () {
                            me.updateVisaCheckoutBillingInfo();
                            me.runForAllSteps(function() {
                                this.trigger('sync');
                                this.isLoading(false);
                            });
                            me.updateShippingInfo();
                        });
                    });
                },
                updateShippingInfo: function() {
                    var me = this;
                    this.apiModel.getShippingMethods().then(function (methods) { 
                        me.get('fulfillmentInfo').refreshShippingMethods(methods);
                    });
                },
                updateVisaCheckoutBillingInfo: function() {
                    //Update the billing info with visa checkout payment
                    var billingInfo = this.get('billingInfo');
                    var activePayments = this.apiModel.getActivePayments();
                    var visaCheckoutPayment = activePayments && _.findWhere(activePayments, { paymentWorkflow: 'VisaCheckout' });
                    if (visaCheckoutPayment) {
                        billingInfo.set('usingSavedCard', false);
                        billingInfo.unset('savedPaymentMethodId');
                        billingInfo.set('card', visaCheckoutPayment.billingInfo.card);
                        billingInfo.unset('billingContact');
                        billingInfo.set('billingContact', visaCheckoutPayment.billingInfo.billingContact, { silent:true });
                        billingInfo.set('paymentWorkflow', visaCheckoutPayment.paymentWorkflow);
                        billingInfo.set('paymentType', visaCheckoutPayment.paymentType);
                        this.refresh();
                    }
                },
                addCoupon: function () {
                    var me = this;
                    var coupons = this.get('couponCode');
                    var code = $.trim(coupons);
                    var orderDiscounts = me.get('orderDiscounts');
                    if (orderDiscounts && _.findWhere(orderDiscounts, { couponCode: code })) {
                        // to maintain promise api
                        var deferred = api.defer();
                        deferred.reject();
                        deferred.promise.otherwise(function () {
                            me.trigger('error', {
                                message: Hypr.getLabel('promoCodeAlreadyUsed', code)
                            });
                        });
                        return deferred.promise;
                    }
                    this.isLoading(true);
                    return this.apiAddCoupon(this.get('couponCode')).then(function () {
    
                        me.get('billingInfo').trigger('sync');
                        me.set('couponCode', '');
    
                        var productDiscounts = _.flatten(_.pluck(me.get('items'), 'productDiscounts'));
                        var shippingDiscounts = _.flatten(_.pluck(_.flatten(_.pluck(me.get('items'), 'shippingDiscounts')), 'discount'));
                        var orderShippingDiscounts = _.flatten(_.pluck(me.get('shippingDiscounts'), 'discount'));
    
                        var allDiscounts = me.get('orderDiscounts').concat(productDiscounts).concat(shippingDiscounts).concat(orderShippingDiscounts);
                        var lowerCode = code.toLowerCase();
    
                        var matchesCode = function (d) {
                            // there are discounts that have no coupon code that we should not blow up on.
                            return (d.couponCode || "").toLowerCase() === lowerCode;
                        };
    
                        if (!allDiscounts || !_.find(allDiscounts, matchesCode))
                        {
                            me.trigger('error', {
                                message: Hypr.getLabel('promoCodeError', code)
                            });
                        }
    
                        else if (me.get('total') === 0) {
                            me.trigger('complete');
                        }
                        me.isLoading(false);

                        $.each(me.attributes.items, function(i,v){
                            if(v.productDiscount){
                                if(v.productDiscount.couponCode){
                                    me.attributes.pdiscount = v.productDiscount.couponCode;
                                }
                            }
                        });
                    });
                },
                onCheckoutSuccess: function () {
                    this.isLoading(true);
                    this.trigger('complete');
                },
                onCheckoutError: function (error) {
                    var order = this,
                        errorHandled = false;
                    order.isLoading(false);
                   if (!error || !error.items || error.items.length === 0) {

                    if (error.message.indexOf('10486') != -1){

                        var siteContext = HyprLiveContext.locals.siteContext,
                            externalPayment = _.findWhere(siteContext.checkoutSettings.externalPaymentWorkflowSettings, {"name" : "PayPalExpress2"}),
                            environment = _.findWhere(externalPayment.credentials, {"apiName" : "environment"}),
                            url = "";

                        if (environment.value.toLowerCase() === "sandbox"){
                            url = "//www.sandbox.paypal.com";
                        }
                        else{
                            url = "//www.paypal.com";
                        }

                        window.location.href = url + "/cgi-bin/webscr?cmd=_express-checkout&token=" + order.get('payments')[order.get('payments').length-1].externalTransactionId;

                        return;
                    }
                    else {
                        error = {
                            items: [
                                {
                                    message: error.message || Hypr.getLabel('unknownError')
                                }
                            ]
                        };
                    }
                }

                    $.each(error.items, function (ix, errorItem) {
                        if (errorItem.name === 'ADD_CUSTOMER_FAILED' && errorItem.message.toLowerCase().indexOf('invalid parameter: password')) {
                            errorHandled = true;
                            order.trigger('passwordinvalid', errorItem.message.substring(errorItem.message.indexOf('Password')));
                        }
                        if (errorItem.errorCode === 'ADD_CUSTOMER_FAILED' && errorItem.message.toLowerCase().indexOf('invalid parameter: emailaddress')) {
                            errorHandled = true;
                            order.trigger('userexists', order.get('emailAddress'));
                        }
                    });
    
                    //on an error, if the card is declined -- and the service returns no card data, lets unset the model.card
                this.apiGet().then(function(res) {
                    if (res.data.billingInfo && !res.data.billingInfo.card) {
                         order.unset('billingInfo.card', {silent: true});
                    }
                    order.trigger('error', error);
                });
                if (!errorHandled) order.messages.reset(error.items);
                    order.isSubmitting = false;
                    $('.preloader').hide();
                    $('.place-order-submit').removeClass('is-processing');
                    throw error;
                },
                addNewCustomer: function () {
                    var self = this,
                    billingInfo = this.get('billingInfo'),
                    billingContact = billingInfo.get('billingContact'),
                    email = this.get('emailAddress'),
                    captureCustomer = function (customer) {
                        if (!customer || (customer.type !== 'customer' && customer.type !== 'login')) return;
                        var newCustomer;
                        if (customer.type === 'customer') newCustomer = customer.data;
                        if (customer.type === 'login') newCustomer = customer.data.customerAccount;
                        if (newCustomer && newCustomer.id) {
                            self.set('customer', newCustomer);
                            api.off('sync', captureCustomer);
                            api.off('spawn', captureCustomer);
                        }
                    };
                    api.on('sync', captureCustomer);
                    api.on('spawn', captureCustomer);
                    return this.apiAddNewCustomer({
                        account: {
                            emailAddress: email,
                            userName: email,
                            firstName: billingContact.get('firstName') || this.get('fulfillmentInfo.fulfillmentContact.firstName'),
                            lastName: billingContact.get('lastNameOrSurname') || this.get('fulfillmentInfo.fulfillmentContact.lastNameOrSurname'),
                            acceptsMarketing: self.get('acceptsMarketing')
                        },
                        password: this.get('password')
                    }).then(function (customer) {
                        self.customerCreated = true;
                        return customer;
                    }, function (error) {
                        self.customerCreated = false;
                        self.isSubmitting = false;
                        $('.preloader').hide();
                        $('.place-order-submit').removeClass('is-processing');
                        throw error;
                    });
                },
                addBillingContact: function () {
                    return this.addCustomerContact('billingInfo', 'billingContact', [{ name: 'Billing' }]);
                },
                addShippingContact: function () {
                    return this.addCustomerContact('fulfillmentInfo', 'fulfillmentContact', [{ name: 'Shipping' }]);
                },
                addShippingAndBillingContact: function () {
                    return this.addCustomerContact('fulfillmentInfo', 'fulfillmentContact', [{ name: 'Shipping' }, { name: 'Billing' }]);
                },
                addCustomerContact: function (infoName, contactName, contactTypes) {
                    var customer = this.get('customer'),
                        contactInfo = this.get(infoName),
                        process = [function () {
                          
                            // Update contact if a valid contact ID exists
                            if (orderContact.id && orderContact.id > 0) {
                                return customer.apiModel.updateContact(orderContact);
                            }
    
                            if (orderContact.id === -1 || orderContact.id === 1 || orderContact.id === 'new') {
                                delete orderContact.id;
                            }
                            return customer.apiModel.addContact(orderContact).then(function(contactResult) {
                                    orderContact.id = contactResult.data.id;
                                    return contactResult;
                                });
                        }];
                    var contactInfoContactName = contactInfo.get(contactName);
                    var customerContacts = customer.get('contacts');
                        
                    if (!contactInfoContactName.get('accountId')) {
                        contactInfoContactName.set('accountId', customer.id);
                    }
                    var orderContact = contactInfoContactName.toJSON();
                    // if customer doesn't have a primary of any of the contact types we're setting, then set primary for those types
                    if (!this.isSavingNewCustomer()) {
                        process.unshift(function() {
                            return customer.apiModel.getContacts().then(function(contacts) {
                                _.each(contactTypes, function(newType) {
                                    var primaryExistsAlready = _.find(contacts.data.items, function(existingContact) {
                                        return _.find(existingContact.types || [], function(existingContactType) {
                                            return existingContactType.name === newType.name && existingContactType.isPrimary;
                                        });
                                    });
                                    newType.isPrimary = !primaryExistsAlready;
                                });
                            });
                        });
                    } else {
                        _.each(contactTypes, function(type) {
                            type.isPrimary = true;
                        });
                    }
    
                    // handle email
                    if (!orderContact.email) orderContact.email = this.get('emailAddress') || customer.get('emailAddress') || require.mozuData('user').email;
    
                    var contactId = orderContact.contactId;
                    if (contactId) orderContact.id = contactId;
                    if (!orderContact.id || orderContact.id === -1 || orderContact.id === 1 || orderContact.id === 'new') {
                        orderContact.types = contactTypes;
                        return api.steps(process);
                    } else {
                        var customerContact = customerContacts.get(orderContact.id).toJSON();
                        if (this.isContactModified(orderContact, customerContact)) {
                            //keep the current types on edit
                            orderContact.types = orderContact.types ? orderContact.types : customerContact.types;
                            return api.steps(process);
                        } else {
                            var deferred = api.defer();
                            deferred.resolve();
                            return deferred.promise;
                        }
                    }
                },
                isContactModified: function(orderContact, customerContact) {
                    var validContact = orderContact && customerContact && orderContact.id === customerContact.id;
                    var addressChanged = validContact && !_.isEqual(orderContact.address, customerContact.address);
                    //Note: Only home phone is used on the checkout page     
                    var phoneChanged = validContact && orderContact.phoneNumbers.home &&
                                        (!customerContact.phoneNumbers.home || orderContact.phoneNumbers.home !== customerContact.phoneNumbers.home);
    
                    //Check whether any of the fields available in the contact UI on checkout page is modified
                    return validContact &&
                        (addressChanged || phoneChanged || 
                        orderContact.email !== customerContact.email || orderContact.firstName !== customerContact.firstName ||
                        orderContact.lastNameOrSurname !== customerContact.lastNameOrSurname);
                },
                saveCustomerCard: function () {
                    var order = this,
                        customer = this.get('customer'), //new CustomerModels.EditableCustomer(this.get('customer').toJSON()),
                        billingInfo = this.get('billingInfo'),
                        isSameBillingShippingAddress = billingInfo.get('isSameBillingShippingAddress'),
                        isPrimaryAddress = this.isSavingNewCustomer(),
                        billingContact = billingInfo.get('billingContact').toJSON(),
                        card = billingInfo.get('card'),
                        doSaveCard = function() {
                            order.cardsSaved = order.cardsSaved || customer.get('cards').reduce(function(saved, card) {
                                saved[card.id] = true;
                                return saved;
                            }, {});
                            var method = order.cardsSaved[card.get('id') || card.get('paymentServiceCardId')] ? 'updateCard' : 'addCard';
                            card.set('contactId', billingContact.id);
                            return customer.apiModel[method](card.toJSON()).then(function(card) {
                                order.cardsSaved[card.data.id] = true;
                                return card;
                            });
                        };
    
                    var contactId = billingContact.contactId;
                    if (contactId) billingContact.id = contactId;
    
                    if (!billingContact.id || billingContact.id === -1 || billingContact.id === 1 || billingContact.id === 'new') {
                        billingContact.types = !isSameBillingShippingAddress ? [{ name: 'Billing', isPrimary: isPrimaryAddress }] : [{ name: 'Shipping', isPrimary: isPrimaryAddress }, { name: 'Billing', isPrimary: isPrimaryAddress }];
                        return this.addCustomerContact('billingInfo', 'billingContact', billingContact.types).then(function (contact) {
                            billingContact.id = contact.data.id;
                            return contact;
                        }).then(doSaveCard);
                    } else {
                        return doSaveCard();
                    }
                },
                setFulfillmentContactEmail: function () {
                    var fulfillmentEmail = this.get('fulfillmentInfo.fulfillmentContact.email'),
                        orderEmail = this.get('email');
    
                    if (!fulfillmentEmail) {
                        this.set('fulfillmentInfo.fulfillmentContact.email', orderEmail);
                    }
                },
                syncBillingAndCustomerEmail: function () {
                    var billingEmail = this.get('billingInfo.billingContact.email'),
                        customerEmail = this.get('emailAddress') || require.mozuData('user').email;
                    if (!customerEmail) {
                        this.set('emailAddress', billingEmail);
                    }
                    if (!billingEmail) {
                        this.set('billingInfo.billingContact.email', customerEmail);
                    }
                },
                addDigitalCreditToCustomerAccount: function () {
                    var billingInfo = this.get('billingInfo'),
                        customer = this.get('customer');
    
                    var digitalCredits = billingInfo.getDigitalCreditsToAddToCustomerAccount();
                    if (!digitalCredits)
                        return;
                    return _.each(digitalCredits, function (cred) {
                        return customer.apiAddStoreCredit(cred.get('code'));
                    });
                },
                isSavingNewCustomer: function() {
                    return this.get('createAccount') && !this.customerCreated;
                },
                 isNonMozuCheckout: function() {        
                var activePayments = this.apiModel.getActivePayments();     
                if (activePayments && activePayments.length === 0) return false;        
                return (activePayments && (_.findWhere(activePayments, { paymentType: 'PayPalExpress2' })));        
                },
                setPONumber: function(poNumber) {
                    //var api = require('modules/api');
                    return api.request('POST', '/api/commerce/orders/' + this.id + '/attributes/',
                    [   
                        {
                            "fullyQualifiedName": "tenant~ponumber",
                             "values": [poNumber] // todo: fill in actual code to fill the PO Number here
                        }
                    ]);
                },
                submit: function () {
                    var ponumber = $.trim(this.get('ponumber'));
                    var comments =  $.trim(this.get('shopperNotes').get('comments'));
                    this.get('shopperNotes').set('comments',comments);
                    this.setPONumber(ponumber);
                    var order = this,
                        billingInfo = this.get('billingInfo'),
                        billingContact = billingInfo.get('billingContact'),
                        isSameBillingShippingAddress = billingInfo.get('isSameBillingShippingAddress'),
                        isSavingCreditCard = false,
                        isSavingNewCustomer = this.isSavingNewCustomer(),
                        isAuthenticated = require.mozuData('user').isAuthenticated,
                        nonStoreCreditTotal = billingInfo.nonStoreCreditTotal(),
                        requiresFulfillmentInfo = this.get('requiresFulfillmentInfo'),
                        requiresBillingInfo = nonStoreCreditTotal > 0,
                        currentPayment = this.apiModel.getCurrentPayment(),
                        process = [function() {
                            return order.update({
                                ipAddress: order.get('ipAddress'),
                                shopperNotes: order.get('shopperNotes').toJSON()
                            });
                        }];
                    if (this.isSubmitting) return;
    
                    this.isSubmitting = true;
    
                    if (requiresBillingInfo && !billingContact.isValid()) {
                        // reconcile the empty address after we got back from paypal and possibly other situations.
                        // also happens with visacheckout ..
                        var billingInfoFromPayment = this.apiModel.getCurrentPayment().billingInfo;
                        billingInfo.set(billingInfoFromPayment, { silent: true });
                    }
    
                    this.syncBillingAndCustomerEmail();
                    this.setFulfillmentContactEmail();
                    if (nonStoreCreditTotal > 0 && this.validate() && ( !this.isNonMozuCheckout() || this.validate().agreeToTerms)) {
                    this.isSubmitting = false;
                    $('.preloader').hide();
                    $('.place-order-submit').removeClass('is-processing');
                    return false;
                   }
                    this.isLoading(true);
    
                    if (isSavingNewCustomer) {
                        process.unshift(this.addNewCustomer); 
                    }
    
                    var activePayments = this.apiModel.getActivePayments();
                    var saveCreditCard = false;
                    if (activePayments !== null && activePayments.length > 0) {
                         var creditCard = _.findWhere(activePayments, { paymentType: 'CreditCard' });
                         if (creditCard && creditCard.billingInfo && creditCard.billingInfo.card) {
                             saveCreditCard = creditCard.billingInfo.card.isCardInfoSaved;
                             billingInfo.set('card', creditCard.billingInfo.card);
                         }
                     }
                     if (saveCreditCard && (this.get('createAccount') || isAuthenticated)) {
                        isSavingCreditCard = true;
                        process.push(this.saveCustomerCard);
                        }
    
                    if ((this.get('createAccount') || isAuthenticated) && billingInfo.getDigitalCreditsToAddToCustomerAccount().length > 0) {
                        process.push(this.addDigitalCreditToCustomerAccount);
                    }
    
                    //save contacts
                     if (!this.isNonMozuCheckout() && (isAuthenticated || isSavingNewCustomer)) {
                        if (!isSameBillingShippingAddress && !isSavingCreditCard) {
                            if (requiresFulfillmentInfo) process.push(this.addShippingContact);
                            if (requiresBillingInfo) process.push(this.addBillingContact);
                        } else if (isSameBillingShippingAddress && !isSavingCreditCard) {
                            process.push(this.addShippingAndBillingContact);
                        } else if (!isSameBillingShippingAddress && isSavingCreditCard && requiresFulfillmentInfo) {
                            process.push(this.addShippingContact);
                        }
                    }
                   
                    process.push(/*this.finalPaymentReconcile, */this.apiCheckout);
                    
                    api.steps(process).then(this.onCheckoutSuccess, this.onCheckoutError);
    
                },
                update: function() {
                    var j = this.toJSON();
                    return this.apiModel.update(j);
                },
                refresh: function() {
                  var me = this;
                  this.trigger('beforerefresh');
                  return this.apiGet().then(function() {
                    me.trigger('refresh');
                    // me.runForAllSteps(function() {
                    //   this.trigger("sync");
                    // });
                  });
                },
                runForAllSteps: function(cb) {
                    var me = this;
                    _.each([
                           'fulfillmentInfo.fulfillmentContact',
                           'fulfillmentInfo',
                           'billingInfo'
                    ], function(name) {
                        cb.call(me.get(name));
                    });
                },
                isReady: function (val) {
                    this.set('isReady', val);
                },
                toJSON: function (options) {
                    var j = Backbone.MozuModel.prototype.toJSON.apply(this, arguments);
                    if (!options || !options.helpers) {
                        delete j.password;
                        delete j.confirmPassword;
                    } 
                    return j;
                }
            });
    
            return {
                CheckoutPage: CheckoutPage
            };
        }
    );


/**
 * Simple extension to Backbone.MozuView that adds an `editing` object in the
 * template evaluation context. Update this `editing` object to indicate which
 * model is in mid-edit.
 */

define('modules/editable-view',['modules/backbone-mozu'], function(Backbone) {

  var EditableView = Backbone.MozuView.extend({
    constructor: function EditableMozuView() {
        Backbone.MozuView.apply(this, arguments);
        this.editing = {};
    },
    getRenderContext: function () {
        var c = Backbone.MozuView.prototype.getRenderContext.apply(this, arguments);
        c.editing = this.editing;
        return c;
    },
    doModelAction: function (action, payload) {
        var self = this,
            renderAlways = function () {
                self.render();
            };
        var operation = this.model[action](payload);
        if (operation && operation.then) {
            operation.then(renderAlways, renderAlways);
            return operation;
        }
    },
    handleLoadingChange: function(isLoading) {
        Backbone.MozuView.prototype.handleLoadingChange.apply(this, arguments);
        var allInputElements = this.$('input,select,button,textarea');
        if (!this.alreadyDisabled && isLoading) {
            this.alreadyDisabled = allInputElements.filter(':disabled');
            allInputElements.prop('disabled',true);
        } else {
            if (this.alreadyDisabled) {
                allInputElements.not(this.alreadyDisabled).removeProp('disabled');
                this.alreadyDisabled = false;
            } else {
                allInputElements.removeProp('disabled');
            }
        }
    }
  });

  return EditableView;

});

/**
 * Quick utility to use on Backbone MozuViews. In case some third party
 * absolutely has to bind an event to an individual DOM element, the view will 
 * need to preserve that actual element between renders. Normally, .render()
 * with HyprLive will destroy and recreate the view's entire innerHTML. This
 * function will take a set of CSS selectors and a callback, and will preserve
 * matching elements through multiple renders, by storing a reference to them
 * and then putting them back where they were. Call this function in your
 * .render() method and send the view-destroying function as its
 * `renderCallback`. You'll be glad you did.
 *
 * Example:
 *
 *     define(['preserve-element-through-render', 'backbone'], 
 *       function(preserveElements, Backbone) {
 *         return Backbone.MozuView.extend({
 *           render: function() {
 *             preserveElements(this, ['.v-button'], function() {
 *               Backbone.MozuView.prototype.render.call(this);
 *             });
 *           }    
 *         });
 *     });
 * 
 * 
 * @param {object} view The Backbone.MozuView we're working with.
 * @param {string[]} selectors An array of selectors for elements to preserve.
 * @param {function} renderCallback A callback representing the render action.
 */

define('modules/preserve-element-through-render',['underscore'], function(_) {
  return function(view, selectors, renderCallback) {
    var thisRound = {};
    view._preserved = view._preserved || {};
    _.each(selectors, function(selector) {
      thisRound[selector] = view.$(selector);
    });
    renderCallback.call(view);
    _.each(thisRound, function($element, selector) {
      var $preserved = view._preserved[selector];
      if ($element.length > 0 && (!$preserved || $preserved.length === 0)) {
        $preserved = view._preserved[selector] = $element;
      }
      if ($preserved && $preserved.length > 0) {
        view.$(selector).replaceWith($preserved);
      }
    });

  };
});
define('modules/eventbus',["underscore", "backbone"], function(_, Backbone){
	return _.extend({}, Backbone.Events);
});
define('modules/amazonpay',['modules/jquery-mozu','modules/eventbus',"modules/api",'hyprlivecontext','underscore'],
function($,EventBus, Api, hyprlivecontext, _) {
	var AmazonPay = {
		sellerId : "",
		clientId : "",
		buttonColor: "",
		buttonType: "",
		usePopUp: true,
		isEnabled: false,
		isScriptLoaded: false,
		viewName:"amazon-checkout",
		init:function(loadScript) {
			var paymentSettings = _.findWhere(hyprlivecontext.locals.siteContext.checkoutSettings.externalPaymentWorkflowSettings, {"name" : "PayWithAmazon"});
			if (!paymentSettings || !paymentSettings.isEnabled) return;
			this.isEnabled = paymentSettings.isEnabled;
			var environment = this.getValue(paymentSettings, "environment");
			var isSandbox = environment == "sandbox";
			var region = this.getValue(paymentSettings, "region");
			this.sellerId = this.getValue(paymentSettings, "sellerId");
			this.clientId = this.getValue(paymentSettings, "clientId");
			this.buttonColor = this.getValue(paymentSettings,"buttonColor") || "Gold";
			this.buttonType = this.getValue(paymentSettings,"buttonType") || "PwA";
			this.usePopUp = (this.getValue(paymentSettings, "usepopup") || "true") == "true";
			this.billingType = this.getValue(paymentSettings, "billingAddressOption") ;
			var regionMappings = {"de" : "eu", "uk" : "eu", "us" : "na", "jp" : "jp"};

			if (this.sellerId && this.clientId && loadScript) {
				var self = this;
				window.sandbox = (isSandbox ? "/sandbox" : "");

				if (region != "us")
					window.sandbox += "/lpa";

				var payWithAmazonUrl = "https://static-"+regionMappings[region]+".payments-amazon.com/OffAmazonPayments/"+ region + window.sandbox + "/js/Widgets.js";

				window.onAmazonLoginReady = function() {
					window.amazon.Login.setClientId(self.clientId); //use clientId
				};
			
				$.getScript(payWithAmazonUrl).done(function(scrit, textStatus){
					//console.log(textStatus);
					self.isScriptLoaded = true;
					EventBus.trigger("aws-script-loaded");
				}).fail(function(jqxhr, settings, exception) {
					console.log(jqxhr);
				});
			}
		},
		getValue: function(paymentSetting, key) {
			var value = _.findWhere(paymentSetting.credentials, {"apiName" : key});

			if (!value) 
				return;
			return value.value;
		},
		addCheckoutButton: function(id, isCart) {
			var self = this;
			if (!self.isEnabled) return;
			var redirectUrl = hyprlivecontext.locals.pageContext.secureHost;
			if (!isCart)
				redirectUrl += "/checkout/"+id+"?isAwsCheckout=true&view="+self.viewName;
			else
				redirectUrl += "/cart?cartId="+id+"&isAwsCheckout=true&view="+self.viewName;
			EventBus.on("aws-script-loaded", function(){
				var authRequest;
				window.OffAmazonPayments.Button("AmazonPayButton", self.sellerId, { //use seller id
					type:  self.buttonType,
					color: self.buttonColor,
					useAmazonAddressBook: true,
					size: (!isCart ? "small" : "large"), 
					authorization: function() {
						var scope = "profile postal_code payments:widget payments:shipping_address";
						if (self.billingType === "1")
							scope += " payments:billing_address";
						
						var loginOptions = {scope: scope, popup: self.usePopUp};
						authRequest = window.amazon.Login.authorize (loginOptions,redirectUrl);
					},
					onError: function(error) {
						console.log("AmazonPay widget errorCode: "+error.getErrorCode());
						console.log("AmazonPay widget erorMessage: "+error.getErrorMessage());
					}
				});
			});
		},
		addAddressWidget: function(awsReferenceId) {
			loadAddressWidget(this.sellerId,awsReferenceId);
		},
		addWalletWidget: function(awsReferenceId) {
			loadWalletWidget(this.sellerId, awsReferenceId);
		}
	};
	return AmazonPay;

	function loadWalletWidget(sellerId,awsReferenceId) {
		var divId = "walletWidgetDiv";
		var walletData = {
			sellerId: sellerId,
			onPaymentSelect: function(orderReference) {
				EventBus.trigger("aws-card-selected");
			},
			design : {
				designMode: 'responsive'
			},
			onError: function(error) {
				console.log(error.getErrorCode());
				console.log(error.getErrorMessage());
			}
		};

		if (awsReferenceId) {
			divId = "readOnlyWalletWidgetDiv";
			walletData.displayMode = "Read";
			walletData.amazonOrderReferenceId = awsReferenceId;
		}
		new window.OffAmazonPayments.Widgets.Wallet(walletData).bind(divId);

	}

	function loadAddressWidget(sellerId,awsReferenceId) {
		var divId = "amazonAddressBookWidgetDiv";
		var addressWalletData = {
			sellerId: sellerId,
			design : {
				designMode: 'responsive'
			},
			onOrderReferenceCreate: function(orderReference) {
				var orderReferenceId = orderReference.getAmazonOrderReferenceId();
				EventBus.trigger("aws-referenceOrder-created", {"orderReferenceId": orderReferenceId});
			},
			onAddressSelect: function(orderReference) {

			},
			onError: function(error) {
				console.log("AmazonPay widget errorCode: "+error.getErrorCode());
				console.log("AmazonPay widget erorMessage: "+error.getErrorMessage());
			}
		};

		if (awsReferenceId) {
			delete addressWalletData.onOrderReferenceCreate;
			delete addressWalletData.onAddressSelect;
			addressWalletData.displayMode = "Read";
			addressWalletData.amazonOrderReferenceId = awsReferenceId;
		}
		new window.OffAmazonPayments.Widgets.AddressBook(addressWalletData).bind(divId);
	}
	
});
require(["modules/jquery-mozu", "underscore", "hyprlive",'modules/api',
 "modules/backbone-mozu", "modules/models-checkout", "modules/views-messages",
  "modules/cart-monitor", 'hyprlivecontext', 'modules/editable-view',
   'modules/preserve-element-through-render','modules/amazonpay'], function ($, _, Hypr, api, Backbone, CheckoutModels, messageViewFactory, CartMonitor, HyprLiveContext, EditableView, preserveElements,AmazonPay) {

    var CheckoutStepView = EditableView.extend({    
        edit: function () {            
            this.model.edit();   
            var obj=event.target;
        }, 
        next: function () {      
           
            var scrollinfo, me = this;
            me.editing.savedCard = false;
            _.defer(function () {
                me.model.next();
               if($(window).width() < 768){ 
                    if($(document).find(".is-incomplete:first").length > 0){
                        scrollinfo=$(document).find(".is-incomplete:first").offset().top - 100;
                    }else{
                        if($(document).find(".is-invalid").length > 0){
                                scrollinfo=$(document).find(".is-invalid:first").offset().top - 100;
                        }else{
                                scrollinfo=$(document).find(".is-new:first").offset().top - 100;        
                        }
                    }
                    var isIE11 = !!(navigator.userAgent.match(/Trident/) && navigator.userAgent.match(/rv[ :]11/));
                    if(isIE11){
                        document.documentElement.scrollTop = scrollinfo;    
                    }else{
                        $('html, body').animate({
                        scrollTop: scrollinfo 
                        }); 
                    } 
                }
            }); 
        },
        amazonShippingAndBilling: function() {
            //isLoading(true);
            window.location = "/checkout/"+window.order.id+"?isAwsCheckout=true&access_token="+window.order.get("fulfillmentInfo").get("data").addressAuthorizationToken+"&view="+AmazonPay.viewName;
        },
        choose: function () { 
            var me = this;
            me.model.choose.apply(me.model, arguments);
        },
        constructor: function () {   
            var me = this;
            EditableView.apply(this, arguments);
            me.resize();
            setTimeout(function () {
                me.$('.mz-panel-wrap').css({ 'overflow-y': 'hidden'});
            }, 250);
            me.listenTo(me.model,'stepstatuschange', me.render, me);
            me.$el.on('keypress', 'input', function (e) {
                if (e.which === 13) {
                    me.handleEnterKey(e);

                    return false;
                }
            });
        },
        initStepView: function() {
            this.model.initStep();
        },
        handleEnterKey: function (e) { 
            this.model.next(); 
        },  
        render: function () {
             $(".mz-formstep.is-incomplete h3").addClass("checkoutbgmh3");
             $(".mz-formstep.is-complete h3").removeClass("checkoutbgmh3");
            this.$el.removeClass('is-new is-incomplete is-complete is-invalid').addClass('is-' + this.model.stepStatus());
            /*var coupon=$.cookie("coupon"); 
            if(coupon=="Removed"){
                $(".removeCoupon").trigger("click");
            }else if(coupon=="added"){
                
            }*/
            EditableView.prototype.render.apply(this, arguments);
            this.resize();
        }, 
        resize: _.debounce(function () {
            this.$('.mz-panel-wrap').animate({'height': this.$('.mz-inner-panel').outerHeight() });
        },200)
    });

    var OrderSummaryView = Backbone.MozuView.extend({
        templateName: 'modules/checkout/checkout-order-summary',

        initialize: function () {
            this.listenTo(this.model.get('billingInfo'), 'orderPayment', this.onOrderCreditChanged, this);
        },

        editCart: function () {
            window.location = "/cart";
        }, 
        renderOnChange: [  
            'couponCodes'
        ],
        render:function(){
            var shippincost=this.model.get('shippingTotal');
            var handlingcost=this.model.get('handlingTotal');
            var shipingHandlingCost=shippincost+handlingcost;
            shipingHandlingCost=shipingHandlingCost.toFixed(2); 
           
            this.model.set('shippingSubTotal',shipingHandlingCost);
            
             Backbone.MozuView.prototype.render.apply(this, arguments);
           
        },
        
        onOrderCreditChanged: function (order, scope) {
            this.render();
        },

        // override loading button changing at inappropriate times
        handleLoadingChange: function () { }
    });

    var ShippingAddressView = CheckoutStepView.extend({
        templateName: 'modules/checkout/step-shipping-address',
        autoUpdate: [
            'firstName',
            'lastNameOrSurname',
            'address.address1',
            'address.address2',
            'address.address3',
            'address.cityOrTown',
            'companyOrOrganization',
            'address.countryCode',
            'address.stateOrProvince',
            'address.postalOrZipCode',
            'address.addressType',
            'phoneNumbers.home',
            'contactId',
            'email',
            'updateaddress',
            'updateMode'
        ],
        renderOnChange: [
            'address.countryCode',
            'contactId'
        ],
        additionalEvents: {   
            "keypress input[name='postal-code']": "preventdata",
            "change #updateaddress":"updateaddres",
            "change .customaddress":"updateaddresmodel",
            "keypress .mz-address-phoneNumber": "numPress",
            "keyup .mz-address-phoneNumber": "numPress"
        },
        numPress: function(e) {
            var key = e.charCode || e.keyCode || 0,
                str = String.fromCharCode(event.key);
                $phone = $(e.currentTarget);
                $phone.val($phone.val().replace(/[^\d-+ ]/g, "")); 
        },
        updateaddresmodel: function(e){ 
            this.model.set(this.model.getOrder().get('customer').get('contacts').get($(e.currentTarget).val()).toJSON(), {silent: true});
            this.model.next();
        },
        updateaddres: function(e){
            var val = $(e.currentTarget).val();
            if(val){
                this.model.set("updateshipaddress",true);
            }else{
                this.model.set("updateshipaddress",false);
            }
        },
        preventdata: function(e){
            var regx = /^[A-Za-z0-9 _.-]+$/;
            if (regx.test(event.key)){
            }else{
                event.preventDefault();
            }
        },
        beginAddContact: function () {
            this.model.set('contactId', 'new');
        },  
        
    });

    var ShippingInfoView = CheckoutStepView.extend({
        templateName: 'modules/checkout/step-shipping-method',
        renderOnChange: [
            'availableShippingMethods'
        ],
        additionalEvents: {
            "change [data-mz-shipping-method]": "updateShippingMethod"
        },
        updateShippingMethod: function (e) {
            this.model.updateShippingMethod(this.$('[data-mz-shipping-method]:checked').val());
        }
    });

    var visaCheckoutSettings = HyprLiveContext.locals.siteContext.checkoutSettings.visaCheckout;
    var pageContext = require.mozuData('pagecontext');
    var BillingInfoView = CheckoutStepView.extend({
        templateName: 'modules/checkout/step-payment-info',
        autoUpdate: [
            'savedPaymentMethodId',
            'paymentType',
            'card.paymentOrCardType',
            'card.cardNumberPartOrMask',
            'card.nameOnCard',
            'card.expireMonth',
            'card.expireYear',
            'card.cvv',
            'card.isCardInfoSaved',
            'check.nameOnCheck',
            'check.routingNumber',
            'check.checkNumber',
            'isSameBillingShippingAddress',
            'billingContact.firstName',
            'billingContact.lastNameOrSurname',
            'billingContact.address.address1',
            'billingContact.address.address2',
            'billingContact.address.address3',
             'billingContact.companyOrOrganization',
            'billingContact.address.cityOrTown',
            'billingContact.address.countryCode',
            'billingContact.address.stateOrProvince',
            'billingContact.address.postalOrZipCode',
            'billingContact.phoneNumbers.home',
            'billingContact.email',
            'creditAmountToApply',   
            'digitalCreditCode'
        ],
        renderOnChange: [  
            'billingContact.address.countryCode',
            'paymentType',
            'isSameBillingShippingAddress',
            'usingSavedCard',
            'savedPaymentMethodId'
        ],
        additionalEvents: {
            "change [data-mz-digital-credit-enable]": "enableDigitalCredit",
            "change [data-mz-digital-credit-amount]": "applyDigitalCredit",
            "change [data-mz-digital-add-remainder-to-customer]": "addRemainderToCustomer",
            "change [name='paymentType']": "resetPaymentData",
            "change #payamazon": "resetPaymentData",
            "click .checkradio":"checkradio",
            "keypress input[name='postal-code']": "preventdata",
            "keypress input[name='security-code']": "preventdata1",
            "keypress .mz-address-phoneNumber": "numPress",
            "keyup .mz-address-phoneNumber": "numPress"
        },
        numPress: function(e) {
            var key = e.charCode || e.keyCode || 0,
            str = String.fromCharCode(event.key);
            $phone = $(e.currentTarget);
            $phone.val($phone.val().replace(/[^\d-+ ]/g, "")); 

        },
        preventdata: function(e){
            var sss = String.fromCharCode(event.keyCode);
            if (/[a-zA-Z0-9-_ ]/.test(sss)){
            }else{
                event.preventDefault();
            }
        },
        preventdata1: function(e){
            var sss = String.fromCharCode(event.keyCode);
            if (/[0-9]/.test(sss)){
            }else{
                event.preventDefault();
            }
        },
        initialize: function () {
            this.listenTo(this.model, 'change:digitalCreditCode', this.onEnterDigitalCreditCode, this);
            this.listenTo(this.model, 'orderPayment', function (order, scope) {
                    this.render();
            }, this);
            this.listenTo(this.model, 'change:savedPaymentMethodId', function (order, scope) {
                $('[data-mz-saved-cvv]').val('').change();
                this.render();
            }, this);
            this.codeEntered = !!this.model.get('digitalCreditCode');
            if(require.mozuData("user").isAnonymous){
                this.model.getOrder().set('acceptsMarketing', true);  
            }    
        },
        resetPaymentData: function (e) {
            if (e.target !== $('[data-mz-saved-credit-card]')[0]) {
                $("[name='savedPaymentMethods']").val('0');
            }
            this.model.clear();
            this.model.resetAddressDefaults();
        },
        checkradio : function(e){       
            $(e.currentTarget).parents(".checkradioparent").find("input[type='radio']").click();
        },
        render: function() {
            
            preserveElements(this, ['.v-button','.p-button', '#amazonButonPaymentSection'], function() {
                CheckoutStepView.prototype.render.apply(this, arguments);
            });
            var status = this.model.stepStatus();
            if ($("#AmazonPayButton").length > 0 && $("#amazonButonPaymentSection").length > 0)
                $("#AmazonPayButton").removeAttr("style").appendTo("#amazonButonPaymentSection");

            if (visaCheckoutSettings.isEnabled && !this.visaCheckoutInitialized && this.$('.v-button').length > 0) {
                window.onVisaCheckoutReady = _.bind(this.initVisaCheckout, this);
                require([pageContext.visaCheckoutJavaScriptSdkUrl]);
                this.visaCheckoutInitialized = true;
            }
            $(document).find("#paypaypal").on("change",function(){
                $(document).find("#btn_xpressPaypal").click();
            });  

            $(document).find("#payamazon").on("change",function(){
                $(document).find("#AmazonPayButton").find("img").click();
            });      
        },
        updateAcceptsMarketing: function(e) {
            this.model.getOrder().set('acceptsMarketing', $(e.currentTarget).prop('checked'));
        },
        updatePaymentType: function(e) {
            var newType = $(e.currentTarget).val();
            this.model.set('usingSavedCard', e.currentTarget.hasAttribute('data-mz-saved-credit-card'));
            this.model.set('paymentType', newType);
        },
        beginEditingCard: function () {
            var me = this;
            if (!this.model.isExternalCheckoutFlowComplete()) {
                this.editing.savedCard = true;
                this.render();
            } else {
                this.cancelExternalCheckout();
            }
        },
        beginEditingExternalPayment: function () {
            var me = this;
            if (this.model.isExternalCheckoutFlowComplete()) {
                this.doModelAction('cancelExternalCheckout').then(function () {
                    me.editing.savedCard = true;
                    me.render();
                });
            }
        },
        beginEditingBillingAddress: function() {
            this.editing.savedBillingAddress = true;
            this.render();
        },
        beginApplyCredit: function () {
            this.model.beginApplyCredit();
            this.render();
        },
        cancelApplyCredit: function () {
            this.model.closeApplyCredit();
            this.render();
        },
        cancelExternalCheckout: function () {
            var me = this;
            this.doModelAction('cancelExternalCheckout').then(function () {
                me.editing.savedCard = false;
                me.render();
            });
        },
        finishApplyCredit: function () {
            var self = this;
            this.model.finishApplyCredit().then(function() {
                self.render();
            });
        },
        removeCredit: function (e) {
            var self = this,
                id = $(e.currentTarget).data('mzCreditId');
            this.model.removeCredit(id).then(function () {
                self.render();
            });
        },
        getDigitalCredit: function (e) {
            var self = this;
            this.$el.addClass('is-loading');
            this.model.getDigitalCredit().ensure(function () {
                self.$el.removeClass('is-loading');
            });
        },
        stripNonNumericAndParseFloat: function (val) {
            if (!val) return 0;
            var result = parseFloat(val.replace(/[^\d\.]/g, ''));
            return isNaN(result) ? 0 : result;
        },
        applyDigitalCredit: function(e) {
            var val = $(e.currentTarget).prop('value'),
                creditCode = $(e.currentTarget).attr('data-mz-credit-code-target');  
            if (!creditCode) {
                return;
            }
            var amtToApply = this.stripNonNumericAndParseFloat(val);
            
            this.model.applyDigitalCredit(creditCode, amtToApply, true);
            this.render();
        },
        onEnterDigitalCreditCode: function(model, code) {
            if (code && !this.codeEntered) {
                this.codeEntered = true;
                this.$el.find('[data-mz-action="getDigitalCredit"]').prop('disabled', false);
            }
            if (!code && this.codeEntered) {   
                this.codeEntered = false;
                this.$el.find('[data-mz-action="getDigitalCredit"]').prop('disabled', true);
            }
        },
        enableDigitalCredit: function(e) {
            var creditCode = $(e.currentTarget).attr('data-mz-credit-code-source'),
                isEnabled = $(e.currentTarget).prop('checked') === true,
                targetCreditAmtEl = this.$el.find("input[data-mz-credit-code-target='" + creditCode + "']"),
                me = this;

            if (isEnabled) {
                targetCreditAmtEl.prop('disabled', false);
                me.model.applyDigitalCredit(creditCode, null, true);
            } else {
                targetCreditAmtEl.prop('disabled', true);
                me.model.applyDigitalCredit(creditCode, 0, false);
                me.render();
            }
        },
        addRemainderToCustomer: function (e) {
            var creditCode = $(e.currentTarget).attr('data-mz-credit-code-to-tie-to-customer'),
                isEnabled = $(e.currentTarget).prop('checked') === true;
            this.model.addRemainingCreditToCustomerAccount(creditCode, isEnabled);
        },
        handleEnterKey: function (e) {
            var source = $(e.currentTarget).attr('data-mz-value');
            if (!source) return;
            switch (source) {
                case "creditAmountApplied":
                    return this.applyDigitalCredit(e);
                case "digitalCreditCode":
                    return this.getDigitalCredit(e);
            }
        },
        /* begin visa checkout */
        initVisaCheckout: function () {
            var me = this;
            var visaCheckoutSettings = HyprLiveContext.locals.siteContext.checkoutSettings.visaCheckout;
            var apiKey = visaCheckoutSettings.apiKey || '0H1JJQFW9MUVTXPU5EFD13fucnCWg42uLzRQMIPHHNEuQLyYk';
            var clientId = visaCheckoutSettings.clientId || 'mozu_test1';
            var orderModel = this.model.getOrder();


            // on success, attach the encoded payment data to the window
            // then call the sdk's api method for digital wallets, via models-checkout's helper
            window.V.on("payment.success", function(payment) {
                //console.log({ success: payment });
                me.editing.savedCard = false;
                me.model.parent.processDigitalWallet('VisaCheckout', payment);
            });

            // for debugging purposes only. don't use this in production
            window.V.on("payment.cancel", function(payment) {
                console.log({ cancel: JSON.stringify(payment) });
            });

            // for debugging purposes only. don't use this in production
            window.V.on("payment.error", function(payment, error) {
                console.warn({ error: JSON.stringify(error) });
            });

            window.V.init({
                apikey: apiKey,
                clientId: clientId,
                paymentRequest: {
                    currencyCode: orderModel.get('currencyCode'),
                    subtotal: "" + orderModel.get('subtotal')
                }
            });
        }
        /* end visa checkout */
    });

    
    var CouponView = Backbone.MozuView.extend({
        templateName: 'modules/checkout/coupon-code-field',
        couponsData:{},
        handleLoadingChange: function (isLoading) {
            // override adding the isLoading class so the apply button 
            // doesn't go loading whenever other parts of the order change
        },
        renderOnChange: [  
            'couponCodes'
        ],
        initialize: function() {
            var self=this;
            this.listenTo(this.model, 'change:couponCode', this.onEnterCouponCode, this);
            this.codeEntered = !!this.model.get('couponCode');
            this.$el.on('keypress', 'input#coupon-code', function (e) {
                if (e.which === 13) { 
                    self.$el.find('.mz-button').trigger('click');
                    return false;
                }
            });
            /*coupon cookie code*/
            var coupon=$.cookie("coupon");     
            var couponObj = {};
            if(typeof coupon !== 'undefined'){
                couponObj = $.parseJSON(coupon);
            }
            var couponCodes = this.model.get('couponCodes');
            var cartId = this.model.id;    
            if((couponCodes !== undefined)&&(couponCodes.length > 0 )){       
                $.each(couponObj,function(key,val){  
                    if(couponCodes.indexOf(key) >= 0 && val === false){ 
                        try{
                            api.request("delete","/api/commerce/orders/"+self.model.id+"/coupons/"+key).then(function(res){
                            //self.model.apiRemoveCoupon(key).then(function (res) {
                                self.model.set('couponCodes',res.couponCodes);
                                self.model.set("orderDiscounts",res.orderDiscounts);
                                self.model.set("discountTotal",res.discountTotal);
                                console.log(res);
                                CartMonitor.updateCart();  
                                location.reload();
                                self.render();
                            });
                        }
                        catch(err){
                            console.log(err);
                        }
                    }
                });
            }    
        },
        onEnterCouponCode: function (model, code) {
            if (code && !this.codeEntered) {
                this.codeEntered = true;
                this.$el.find('button').prop('disabled', false);
            }
            if (!code && this.codeEntered) {
                this.codeEntered = false;
                this.$el.find('button').prop('disabled', true);
            }
        },
        removecouponcode:function(e){  
            var self=this,CartData = this.model.apiModel.data, $couponcode = $(e.currentTarget), id=$couponcode.data('mz-coupon-code');
            
                //self.model.apiRemoveCoupons(id).then(function (res) {
                api.request("delete","/api/commerce/orders/"+self.model.id+"/coupons/"+id).then(function(res){
                    var getExistsData = $.cookie('coupon');
                    if(getExistsData && getExistsData!== ""){
                        self.couponsData = JSON.parse(getExistsData);
                    }
                    self.couponsData[id]= false;
                    if((self.model.get("pdiscount") !== undefined) && (self.model.get("pdiscount") !== "")){
                        self.model.set("pdiscount","");
                    }
                    $.cookie("coupon", JSON.stringify(self.couponsData), {  path: '/',expires: 7 });
                    self.model.set('couponCodes',res.couponCodes);
                    self.model.set("orderDiscounts",res.orderDiscounts);
                    self.model.set("discountTotal",res.discountTotal);
                    self.model.unset('couponCode');
                    location.reload();  
                    CartMonitor.updateCart();
                    self.render();  
                });   
        },
        autoUpdate: [
            'couponCode'
        ],
        addCoupon: function (e) {  
            // add the default behavior for loadingchanges
            // but scoped to this button alone
            
            var self = this;
            var obj=e.currentTarget;
            var coup=$(obj).parent().find("#coupon-code").val();
            var couponArr = self.model.get('couponCodes');
            var couponCode = $('#coupon-code').val();

            this.$el.addClass('is-loading');  
            this.model.addCoupon().ensure(function() {   
                if(couponArr.indexOf(couponCode) < 0){
                    var getExistsData = $.cookie('coupon');
                   if(getExistsData && getExistsData!== ""){
                      self.couponsData = JSON.parse(getExistsData);
                   }
                   self.couponsData[couponCode]= true;
                   $.cookie("coupon", JSON.stringify(self.couponsData), {  path: '/',expires: 7 });
                }
                self.$el.removeClass('is-loading');
                self.model.unset('couponCode');
                CartMonitor.updateCart();
                self.render(); 
            });
        },
        handleEnterKey: function () {
            this.addCoupon();
        },

        
    });

    var CommentsView = Backbone.MozuView.extend({   
        templateName: 'modules/checkout/comments-field', 
        autoUpdate: ['shopperNotes.comments','ponumber']
    });

    var ReviewOrderView = Backbone.MozuView.extend({
        templateName: 'modules/checkout/step-review',
        autoUpdate: [
            'createAccount',
            'agreeToTerms',
            'emailAddress',
            'password',
            'confirmPassword'
        ],
        renderOnChange: [
            'createAccount',
            'isReady'
        ],
        initialize: function () {
            var me = this;
            this.$el.on('keypress', 'input', function (e) {
                if (e.which === 13) {
                    me.handleEnterKey();
                    return false;
                }
            });
            this.model.on('passwordinvalid', function(message) {
                me.$('[data-mz-validationmessage-for="password"]').text(message);
            });
            this.model.on('userexists', function (user) {
                me.$('[data-mz-validationmessage-for="emailAddress"]').html(Hypr.getLabel("customerAlreadyExists", user, encodeURIComponent(window.location.pathname)));
            });
        },
        
        submit: function () {
            
            //loader
            $('.preloader').show();
            $('.preloader').css({'opacity': "0.5"});
            $('.preloader svg').hide();
            $('.place-order-submit').addClass('is-processing');
            
            var self = this;
            _.defer(function () {
                self.model.submit();
            });
        },
        handleEnterKey: function () {
            this.submit();
        }
    });

    var ParentView = function(conf) {
      var gutter = parseInt(Hypr.getThemeSetting('gutterWidth'), 10);
      if (isNaN(gutter)) gutter = 15;
      var mask;
      conf.model.on('beforerefresh', function() {
         killMask();
         conf.el.css('opacity',0.5);
         var pos = conf.el.position();
         mask = $('<div></div>', {
           'class': 'mz-checkout-mask'
         }).css({
           width: conf.el.outerWidth() + (gutter * 2),
           height: conf.el.outerHeight() + (gutter * 2),
           top: pos.top - gutter,
           left: pos.left - gutter
         }).insertAfter(conf.el);
      });
      function killMask() {
        conf.el.css('opacity',1);
        if (mask) mask.remove();
      }
      conf.model.on('refresh', killMask); 
      conf.model.on('error', killMask);
      return conf;
    };

    $(document).ready(function () {
        
         api.on('error', function(badPromise, xhr, requestConf) { 
                console.log("error");
            });
        if(require.mozuData("pagecontext").isMobile){ 
            $("#checkout-rightcol").insertBefore("#checkout-leftcol");
        }
        
        $(document).on("click", ".tnc-link", function() {
                $('body').css('overflowY', 'hidden');
            });
            $(document).on("click", ".close", function() {
                $('body').css('overflowY', 'auto');
            });
        $(".mz-contactselector .mz-contactselector-contact").hide();
        var $checkoutView = $('#checkout-form'),
            checkoutData = require.mozuData('checkout');

        AmazonPay.init(true);
        window.CheckoutModels =CheckoutModels;
        checkoutData.isAmazonPayEnable = AmazonPay.isEnabled;
        var checkoutModel = window.order = new CheckoutModels.CheckoutPage(checkoutData);
        $.each(checkoutModel.attributes.items, function(i,v){
                    if(v.productDiscount){
                        if(v.productDiscount.couponCode){
                            checkoutModel.attributes.pdiscount = v.productDiscount.couponCode;
                        }
                    }
                });

            var checkoutViews = {
                parentView: new ParentView({
                  el: $checkoutView,
                  model: checkoutModel
                }),
                steps: {
                    shippingAddress: new ShippingAddressView({
                        el: $('#step-shipping-address'),
                        model: checkoutModel.get("fulfillmentInfo").get("fulfillmentContact")
                    }),
                    shippingInfo: new ShippingInfoView({
                        el: $('#step-shipping-method'),
                        model: checkoutModel.get('fulfillmentInfo')
                    }),
                    paymentInfo: new BillingInfoView({
                        el: $('#step-payment-info'),
                        model: checkoutModel.get('billingInfo')
                    })
                },
                orderSummary: new OrderSummaryView({
                    el: $('#order-summary'),
                    model: checkoutModel
                }),
                couponCode: new CouponView({
                    el: $('#coupon-code-field'),
                    model: checkoutModel
                }),
                comments: Hypr.getThemeSetting('showCheckoutCommentsField') && new CommentsView({
                    el: $('#comments-field'),
                    model: checkoutModel
                }),
                
                reviewPanel: new ReviewOrderView({
                    el: $('#step-review'),
                    model: checkoutModel
                }),
                messageView: messageViewFactory({
                    el: $checkoutView.find('[data-mz-message-bar]'),
                    model: checkoutModel.messages
                })
            };

        window.checkoutViews = checkoutViews;
        checkoutViews.couponCode.render();
        checkoutModel.on('complete', function() {
            CartMonitor.setCount(0);
            if (window.amazon)
                window.amazon.Login.logout();
            window.location = "/checkout/" + checkoutModel.get('id') + "/confirmation";
        });

        var $reviewPanel = $('#step-review');
        checkoutModel.on('change:isReady',function (model, isReady) {
            if (isReady) {
                setTimeout(function () { window.scrollTo(0, $reviewPanel.offset().top - 100); }, 750);
            }
        });

        _.invoke(checkoutViews.steps, 'initStepView');  
   
        checkoutViews.orderSummary.render();
        $checkoutView.noFlickerFadeIn();

        if (AmazonPay.isEnabled)
            AmazonPay.addCheckoutButton(window.order.id, false);
        var pageaction, user = require.mozuData('user');
        if (user.isAnonymous) {
            if(checkoutData.billingInfo){   
            }else{   
                var gmail=$.cookie("guest"); 
                $('#billing-email').val(gmail);
                $('#billing-email').blur();  
            }  
        }
        
    }); 
});

define("pages/checkout", function(){});
