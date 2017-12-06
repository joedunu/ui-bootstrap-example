'use strict';

describe('productApplication/accountConfigurationCtrl', function () {

    var $controller, createController, scope, addressFormatter, offersAndFeesService,
        productService, personalSituationFormMapper, buanaService, $q, accountConfigurationService, modal,
        dataStoreService, $state, shoppingCartService, utils, needsDataService, dataService, rootScope, language, workflow,
        referenceDataService;

    var dataModel = {
        customerProfiles: [{
            individual: {
                externalCustomerNames: [
                    {
                        externalSystem: 'CAP CIS',
                        name: 'PERSONAL CUSTOMER TEST02'
                    }
                ],
                cspCustomerId: 1
            }
        }],
        orders: [{
            productBundles: [{
                productId: '1234',
                name: 'Some product name'
            }],
            cartId: 1,
            id: 1,
            orderId: '1',
            orderPriority: 3
        }]
    };

    var originator = {
        'bankerBSB': '012345',
        'channelType': 'iKnow Telesales',
        'email': 'IKCF10@anz.com',
        'firstName': 'El',
        'lanId': 'bduat01',
        'lastName': 'Deano'
    };

    var mockAssessmentDataBranch = {
        'bankerBSB': '012345',
        'channelType': 'iKnow Branch',
        'email': 'IKCF10@anz.com',
        'firstName': 'El',
        'lanId': 'bduat01',
        'lastName': 'Deano'
    };

    var firstName = 'Shaun';
    var fullName = 'Shaun Ab';
    var mailingAddress = 'Melbourne';
    var emailAddress = 'ab@cd.com';

    var bdConfigurationDisabled = {
        'ENABLE_E_STATEMENT': false
    };

    var features = [{
        'id': 'cardType',
        'group': 'Y',
        'priority': '1',
        'value': 'Visa Debit card',
        'description': 'Blue card',
        'picture': 'products/orderCard/bluevisa.jpg',
        'cardlinkagenumber': '5',
        'cardtype': '2',
        'carddesign': 'ANZAccessVisaDebit',
        'accesslevel': 'blue',
        'fastCash': 'Full',
        'fastBalance': '1',
        'ageEligibility': '14'
    }];

    var loadingSpinnerService = {
        start: function () {
        },
        finish: function () {
        }
    };

    var languageValues = {
        'RESPONSE_ERRORS': {
            'STATUS_400': 'Bad Request',
            'STATUS_403': 'Forbidden',
            'STATUS_500': 'Internal Server Error',
            'STATUS_412': 'Precondition Failed'
        },
        fatalError: {
            submissionError: 'abc',
            bsbError: 'cde'
        }
    };

    beforeEach(function () {
        angular.mock.module('products', function ($provide) {
            $provide.value('language', languageValues);
        });
        angular.mock.module('modal', 'dataStore', 'cart');
    });

    beforeEach(function () {
        inject(function (_$controller_, $rootScope, _productService_, _addressFormatter_, _offersAndFeesService_,
                         _personalSituationFormMapper_, _buanaService_, _$q_, _accountConfigurationService_, _modal_,
                         _dataStoreService_, _$state_, _shoppingCartService_, _utils_, _needsDataService_, _dataService_,
                         _language_, _workflow_, _referenceDataService_) {
            $controller = _$controller_;
            $q = _$q_;
            rootScope = $rootScope;
            scope = $rootScope.$new();
            addressFormatter = _addressFormatter_;
            offersAndFeesService = _offersAndFeesService_;
            productService = _productService_;
            personalSituationFormMapper = _personalSituationFormMapper_;
            buanaService = _buanaService_;
            dataStoreService = _dataStoreService_;
            accountConfigurationService = _accountConfigurationService_;
            shoppingCartService = _shoppingCartService_;
            modal = _modal_;
            $state = _$state_;
            utils = _utils_;
            needsDataService = _needsDataService_;
            dataService = _dataService_;
            language = _language_;
            workflow = _workflow_;
            referenceDataService = _referenceDataService_;
            createController = function (bdConfiguration) {
                return $controller('accountConfigurationCtrl', {
                    $scope: scope,
                    dataModel: dataModel,
                    productService: productService,
                    addressFormatter: addressFormatter,
                    bdConfiguration: bdConfiguration,
                    buanaService: buanaService,
                    dataStoreService: dataStoreService,
                    modal: modal,
                    $state: $state,
                    accountConfigurationService: accountConfigurationService,
                    utils: utils,
                    shoppingCartService: shoppingCartService,
                    loadingSpinnerService: loadingSpinnerService,
                    language: language,
                    workflow: workflow,
                    referenceDataService: referenceDataService
                });
            };
        });
        spyOn(dataStoreService, 'getData').and.returnValue(dataModel);
        spyOn(dataService, 'getAssessmentDataByPath').and.returnValue(originator);
        spyOn(productService, 'getFeatureByFeatureType').and.returnValue({});
        spyOn(JSON, 'parse').and.returnValue(features);
        spyOn(loadingSpinnerService, 'start');
        spyOn(loadingSpinnerService, 'finish');
        spyOn(buanaService, 'getCrns').and.returnValue($q.when([]));
        spyOn(workflow, 'isKYCCompleted').and.returnValue(false);
        scope.products = {stepper: '1'};
    });

    it('should set up a stepper value', function () {
        //Mock out what the parent controller which is productsCtrl would have set on it
        scope.products = {stepper: '1'};
        createController();
        expect(scope.products.stepper).toEqual('1');
    });

    it('should set up the personal info', function () {
        spyOn(personalSituationFormMapper, 'extractFirstName').and.returnValue(firstName);
        spyOn(personalSituationFormMapper, 'extractFullName').and.returnValue(fullName);
        spyOn(personalSituationFormMapper, 'extractMailingAddress').and.returnValue(mailingAddress);
        spyOn(personalSituationFormMapper, 'extractEmailAddress').and.returnValue(emailAddress);

        scope.products = {stepper: '1'};
        var ctrl = createController();

        expect(ctrl.model.customerData[0].firstName).toEqual(firstName);
        expect(ctrl.model.customerData[0].fullName).toEqual(fullName);
        expect(ctrl.model.customerData[0].mailingAddress).toEqual(mailingAddress);
        expect(ctrl.model.customerData[0].emailAddress).toEqual(emailAddress);
    });

    it('should flag true if the address is Australian', function () {
        var mailingAddress = {
            country: 'AU'
        };
        spyOn(personalSituationFormMapper, 'extractFirstName').and.returnValue(firstName);
        spyOn(personalSituationFormMapper, 'extractFullName').and.returnValue(fullName);
        spyOn(personalSituationFormMapper, 'extractMailingAddress').and.returnValue(mailingAddress);
        spyOn(personalSituationFormMapper, 'extractEmailAddress').and.returnValue(emailAddress);

        scope.products = {stepper: '1'};
        var ctrl = createController();

        expect(ctrl.model.customerData[0].isAustralianAddress).toEqual(true);
    });

    it('should flag false if the address is Australian', function () {
        var mailingAddress = {
            country: 'AT'
        };
        spyOn(personalSituationFormMapper, 'extractFirstName').and.returnValue(firstName);
        spyOn(personalSituationFormMapper, 'extractFullName').and.returnValue(fullName);
        spyOn(personalSituationFormMapper, 'extractMailingAddress').and.returnValue(mailingAddress);
        spyOn(personalSituationFormMapper, 'extractEmailAddress').and.returnValue(emailAddress);

        scope.products = {stepper: '1'};
        var ctrl = createController();

        expect(ctrl.model.customerData[0].isAustralianAddress).toEqual(false);
    });

    it('should call selectCrnsModal of modal object', function () {
        spyOn(modal, 'selectCrnsModal');

        var ctrl = createController();
        ctrl.showCrnSelectModal();
        expect(modal.selectCrnsModal).toHaveBeenCalled();
    });

    it('should call updateSelectedCard', function () {
        var ctrl = createController();
        expect(ctrl.model.cardSelected).toEqual({});
    });

    it('should set up orderCardInfo', function () {
        var ctrl = createController();
        expect(ctrl.displayOrderCard).toEqual(true);
        expect(ctrl.model.orderCardInfo).toEqual(features);
    });

    it('should show card selected modal', function () {
        spyOn(modal, 'selectCardModal');
        var ctrl = createController();
        ctrl.showCardSelectModal();
        expect(ctrl.model.orderCardInfo[0].selected).toEqual(false);
        expect(modal.selectCardModal).toHaveBeenCalled();
    });

    it('should get the image', function () {
        spyOn(utils, 'imageRequire');
        var ctrl = createController();
        ctrl.getImage('products/orderCard/bluevisa.jpg');
        expect(utils.imageRequire).toHaveBeenCalledWith('products/orderCard/bluevisa.jpg');
    });

    it('should remove any card selected when the remove card selection button is clicked', function () {
        var ctrl = createController();
        ctrl.removeCardSelection();

        expect(ctrl.model.orderCardInfo[0]).not.toContain('cardSelected');
        expect(dataModel).not.toContain('cardSelected');
    });

    it('should show the card consent modal', function () {
        spyOn(modal, 'cardConsentModal');
        var ctrl = createController();
        ctrl.showCardConsentModal();
        expect(modal.cardConsentModal).toHaveBeenCalledWith(ctrl.confirmConsentReceived);
    });

    it('should show card consent modal for call centre bankers', function () {
        spyOn(modal, 'cardConsentModal');
        var ctrl = createController();
        ctrl.selectCard();
        expect(modal.cardConsentModal).toHaveBeenCalledWith(ctrl.confirmConsentReceived);
    });

    it('should show select card modal for branch bankers', function () {
        dataService.getAssessmentDataByPath = jasmine.createSpy().and.returnValue(mockAssessmentDataBranch);
        spyOn(modal, 'selectCardModal');
        var ctrl = createController();
        ctrl.selectCard();
        expect(modal.selectCardModal).toHaveBeenCalled();
    });

    it('should confirm the customer consent received', function () {
        spyOn(modal, 'selectCardModal');
        var ctrl = createController();
        ctrl.confirmConsentReceived();
        expect(modal.selectCardModal).toHaveBeenCalled();
    });

    describe('Bank statement Configuration', function () {

        var estatementProductEnabled = {
            featureType: {
                name: 'estatementAvailble'
            },
            value: 'Y'
        };

        var estatementProductDisabled = {
            featureType: {
                name: 'estatementAvailble'
            },
            value: 'N'
        };

        var bdConfigurationEnabled = {
            'ENABLE_E_STATEMENT': true
        };

        it('should send bank statements to mailing address when product ' +
            'does not allow eStatements', function () {

            // eStatement not recommended by product
            spyOn(addressFormatter, 'formatAddressAsString').and.returnValue('833 collins st, Docklands, Vic-3008');
            productService.getFeatureByFeatureType = jasmine.createSpy().and.returnValue(estatementProductDisabled);
            spyOn(personalSituationFormMapper, 'extractEmailAddress').and.returnValue('');

            var ctrl = createController(bdConfigurationEnabled);

            expect(ctrl.model.customerData[0].bankStatementTo).toEqual('833 collins st, Docklands, Vic-3008');

        });

        it('should send bank statements to mailing address when product ' +
            'does not have eStatements feature', function () {

            spyOn(addressFormatter, 'formatAddressAsString').and.returnValue('833 collins st, Docklands, Vic-3008');
            // No feature for estatement available for feature
            productService.getFeatureByFeatureType = jasmine.createSpy().and.returnValue({});
            spyOn(personalSituationFormMapper, 'extractEmailAddress').and.returnValue('');

            var ctrl = createController(bdConfigurationEnabled);

            expect(ctrl.model.customerData[0].bankStatementTo).toEqual('833 collins st, Docklands, Vic-3008');

        });

        it('should send bank statements to mailing address when customer ' +
            'does not provide email address', function () {
            spyOn(addressFormatter, 'formatAddressAsString').and.returnValue('833 collins st, Docklands, Vic-3008');
            productService.getFeatureByFeatureType = jasmine.createSpy().and.returnValue(estatementProductEnabled);
            spyOn(personalSituationFormMapper, 'extractEmailAddress').and.returnValue('');

            var ctrl = createController(bdConfigurationEnabled);

            expect(ctrl.model.customerData[0].bankStatementTo).toEqual('833 collins st, Docklands, Vic-3008');
        });

        it('should send bank statements to mailing address when reference data service ' +
            'does not allow eStatements', function () {

            spyOn(addressFormatter, 'formatAddressAsString').and.returnValue('833 collins st, Docklands, Vic-3008');
            productService.getFeatureByFeatureType = jasmine.createSpy().and.returnValue(estatementProductEnabled);
            spyOn(personalSituationFormMapper, 'extractEmailAddress').and.returnValue(null);

            var ctrl = createController(bdConfigurationDisabled);

            expect(ctrl.model.customerData[0].bankStatementTo).toEqual('833 collins st, Docklands, Vic-3008');
        });

        it('should send bank statements to email address when product, reference data service ' +
            'allow eStatements and email address available for the customer', function () {
            productService.getFeatureByFeatureType = jasmine.createSpy().and.returnValue(estatementProductEnabled);
            spyOn(personalSituationFormMapper, 'extractEmailAddress').and.returnValue('abc@abc.com');

            var ctrl = createController(bdConfigurationEnabled);

            expect(ctrl.model.customerData[0].bankStatementTo).toEqual('abc@abc.com');
        });
    });

    describe('Crn Selection', function () {
        var bdConfigurationDisabled = {
            'ENABLE_E_STATEMENT': false
        };

        var crnsInfoListNoDesignated = [{
            designated: false,
            lastAccessDateTime: '2016-07-10',
            crn: {
                accountNumber: '123456789'
            }
        }, {
            designated: false,
            lastAccessDateTime: '2016-07-09',
            crn: {
                accountNumber: '987654321'
            }
        }];

        var crnsInfoListAllDesignated = [{
            designated: true,
            lastAccessDateTime: '2016-07-10',
            crn: {
                accountNumber: '123456789'
            }
        }, {
            designated: true,
            lastAccessDateTime: '2016-07-09',
            crn: {
                accountNumber: '987654321'
            }
        }];
        beforeEach(function () {
            dataModel.crnsInfoCollection = undefined;
            dataModel.cardSelected = {};
        });

        it('should identify that no crns available or selected, when empty array of crnInfo returned by buanaService', function () {

            var crnsInfoListNone = [];

            //real check
            buanaService.getCrns = jasmine.createSpy().and.returnValue($q.when(crnsInfoListNone));
            var ctrl = createController(bdConfigurationDisabled);
            scope.$apply();
            expect(ctrl.model.crnsInfoCollection.length).toBe(0);
            expect(ctrl.model.designatedCrns.length).toBe(0);
            expect(ctrl.model.crnsAvailable).toBe(false);
            expect(ctrl.model.crnsSelected).toBe(false);
            expect(ctrl.model.crnsPreselected).not.toBeDefined();
            expect(ctrl.model.cardSelected).toBeDefined();
            expect(loadingSpinnerService.start).toHaveBeenCalled();
            expect(loadingSpinnerService.finish).toHaveBeenCalled();
        });

        it('should identify that crns available but not selected, when none crnInfo in array returned by buanaService marked as designated', function () {

            //real check
            buanaService.getCrns = jasmine.createSpy().and.returnValue($q.when(crnsInfoListNoDesignated));
            var ctrl = createController(bdConfigurationDisabled);
            scope.$apply();
            expect(ctrl.model.crnsInfoCollection.length).toBe(2);
            expect(ctrl.model.designatedCrns.length).toBe(0);
            expect(ctrl.model.crnsAvailable).toBe(true);
            expect(ctrl.model.crnsSelected).toBe(false);
            expect(ctrl.model.crnsPreselected).not.toBeDefined();
            expect(ctrl.model.cardSelected).toBeDefined();
            expect(loadingSpinnerService.start).toHaveBeenCalled();
            expect(loadingSpinnerService.finish).toHaveBeenCalled();
        });

        it('should identify that crns available and selected, when crnInfo in array returned by buanaService marked as designated', function () {

            //real check
            buanaService.getCrns = jasmine.createSpy().and.returnValue($q.when(crnsInfoListAllDesignated));
            var ctrl = createController(bdConfigurationDisabled);
            scope.$apply();
            expect(ctrl.model.crnsInfoCollection.length).toBe(2);
            expect(ctrl.model.designatedCrns.length).toBe(2);
            expect(ctrl.model.crnsAvailable).toBe(true);
            expect(ctrl.model.crnsSelected).toBe(true);
            expect(ctrl.model.crnsPreselected).toBe(true);
            expect(ctrl.model.cardSelected).toBeDefined();
            expect(loadingSpinnerService.start).toHaveBeenCalled();
            expect(loadingSpinnerService.finish).toHaveBeenCalled();
        });

        it('should not call buanaService when crn information is available in dataModel', function () {
            dataModel.crnsInfoCollection = [{
                designated: false,
                lastAccessDateTime: '2016-07-10',
                crn: {
                    accountNumber: '123456789'
                }
            }];

            createController();
            scope.$apply();

            expect(buanaService.getCrns).not.toHaveBeenCalled();
            expect(loadingSpinnerService.start).not.toHaveBeenCalled();
            expect(loadingSpinnerService.finish).not.toHaveBeenCalled();
        });

        it('should identify that no crns available or selected, when empty array of crnInfo from dataModel', function () {
            dataModel.crnsInfoCollection = [];
            var ctrl = createController(bdConfigurationDisabled);
            scope.$apply();

            expect(buanaService.getCrns).not.toHaveBeenCalled();
            expect(loadingSpinnerService.start).not.toHaveBeenCalled();
            expect(loadingSpinnerService.finish).not.toHaveBeenCalled();
            expect(ctrl.model.crnsInfoCollection.length).toBe(0);
            expect(ctrl.model.designatedCrns.length).toBe(0);
            expect(ctrl.model.crnsAvailable).toBe(false);
            expect(ctrl.model.crnsSelected).toBe(false);
            expect(ctrl.model.crnsPreselected).not.toBeDefined();
            expect(ctrl.model.cardSelected).toBeDefined();
        });

        it('should identify that crns available but not selected, when none crnInfo in dataModel marked as designated', function () {
            dataModel.crnsInfoCollection = crnsInfoListNoDesignated;
            var ctrl = createController(bdConfigurationDisabled);
            scope.$apply();

            expect(buanaService.getCrns).not.toHaveBeenCalled();
            expect(loadingSpinnerService.start).not.toHaveBeenCalled();
            expect(loadingSpinnerService.finish).not.toHaveBeenCalled();
            expect(ctrl.model.crnsInfoCollection.length).toBe(2);
            expect(ctrl.model.designatedCrns.length).toBe(0);
            expect(ctrl.model.crnsAvailable).toBe(true);
            expect(ctrl.model.crnsSelected).toBe(false);
            expect(ctrl.model.crnsPreselected).not.toBeDefined();
            expect(ctrl.model.cardSelected).toBeDefined();
        });

        it('should identify that crns available and selected, when crnInfo in dataModel marked as designated', function () {
            dataModel.crnsInfoCollection = crnsInfoListAllDesignated;
            dataModel.crnsPreselected = true;
            var ctrl = createController(bdConfigurationDisabled);
            scope.$apply();

            expect(buanaService.getCrns).not.toHaveBeenCalled();
            expect(loadingSpinnerService.start).not.toHaveBeenCalled();
            expect(loadingSpinnerService.finish).not.toHaveBeenCalled();
            expect(ctrl.model.crnsInfoCollection.length).toBe(2);
            expect(ctrl.model.designatedCrns.length).toBe(2);
            expect(ctrl.model.crnsAvailable).toBe(true);
            expect(ctrl.model.crnsSelected).toBe(true);
            expect(ctrl.model.crnsPreselected).toEqual(true);
            expect(ctrl.model.cardSelected).toBeDefined();
        });

        it('should return disabled false when customer is KYC completed ', function () {
            var ctrl = createController(bdConfigurationDisabled);
            expect(ctrl.disableAddCard()).toEqual(true);
        });

    });

    describe('multi customer - account relationship', function() {
        it('getAccountRelationshipDesc should return account relationship description', function() {
            var ctrl = createController();

            var accountRelationshipTypes =  ctrl.referenceDataService.getReferenceValueByProperty('com.anz.csp.bd.accountRelationshipType');
            var result = ctrl.getAccountRelationshipDesc(accountRelationshipTypes, 'SOL');
            expect(ctrl.getAccountRelationshipDesc).toHaveBeenCalled();
            expect(result).toBe('Sole Owner');
        });
    });

    describe('back button', function () {
        it('should update form values to dataModel', function () {

            var crnsInfoListAllDesignated = [{
                designated: true,
                lastAccessDateTime: '2016-07-10',
                crn: {
                    accountNumber: '123456789'
                }
            }, {
                designated: true,
                lastAccessDateTime: '2016-07-09',
                crn: {
                    accountNumber: '987654321'
                }
            }];

            spyOn($state, 'go');

            var ctrl = createController();
            ctrl.model = {};
            ctrl.model.crnsPreselected = true;
            ctrl.model.crnsInfoCollection = crnsInfoListAllDesignated;
            ctrl.model.cardSelected = {};

            ctrl.back();

            expect(dataModel.crnsPreselected).toEqual(true);

            expect(dataModel.crnsInfoCollection).toEqual(crnsInfoListAllDesignated);
            expect(dataModel.cardSelected).toEqual({});
            expect($state.go).toHaveBeenCalled();

        });
    });

    xdescribe('Application submit', function () {
        it('should display spinner and move to next page on successful submit', function () {

            var submitResponse = {
                orderNumber: 1,
                version: 2
            };

            var postStateChangeResponse = {
                headers: function () {
                    return {'e-tag': '2'};
                },
                status: 200,
                data: {
                    code: '9062'
                },
                orderId: 1
            };

            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.when([submitResponse]));
            spyOn(accountConfigurationService, 'triggerPOStateChange').and.returnValue($q.when(postStateChangeResponse));
            spyOn(shoppingCartService, 'finalizeItem').and.returnValue($q.when({}));
            spyOn(needsDataService, 'updateCartCount');
            spyOn($state, 'go').and.callFake(angular.noop);

            var ctrl = createController(bdConfigurationDisabled);
            //real call
            ctrl.submitProductApplication();
            scope.$apply();

            expect(accountConfigurationService.submitApplication).toHaveBeenCalledWith(dataModel, ctrl.model);
            expect(accountConfigurationService.triggerPOStateChange).toHaveBeenCalledWith(submitResponse.orderNumber);
            expect(shoppingCartService.finalizeItem).toHaveBeenCalledWith(1, 1);
            expect(needsDataService.updateCartCount).toHaveBeenCalled();
            expect($state.go).toHaveBeenCalledWith('bd.products.servicesetup');
            expect(loadingSpinnerService.start).toHaveBeenCalled();
            expect(loadingSpinnerService.finish).toHaveBeenCalled();
        });

        it('should display spinner and move to next page on successful submit without any errors', function () {

            var submitResponse = {
                orderNumber: 1,
                version: 2
            };

            var postStateChangeResponse = {
                headers: function () {
                    return {'e-tag': '2'};
                },
                status: 200,
                orderId: 1
            };

            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.when([submitResponse]));
            spyOn(accountConfigurationService, 'triggerPOStateChange').and.returnValue($q.when(postStateChangeResponse));
            spyOn(shoppingCartService, 'finalizeItem').and.returnValue($q.when({}));
            spyOn(needsDataService, 'updateCartCount');
            spyOn($state, 'go').and.callFake(angular.noop);

            var ctrl = createController(bdConfigurationDisabled);
            //real call
            ctrl.submitProductApplication();
            scope.$apply();

            expect(accountConfigurationService.submitApplication).toHaveBeenCalledWith(dataModel, ctrl.model);
            expect(accountConfigurationService.triggerPOStateChange).toHaveBeenCalledWith(submitResponse.orderNumber);
            expect(shoppingCartService.finalizeItem).toHaveBeenCalledWith(1, 1);
            expect(needsDataService.updateCartCount).toHaveBeenCalled();
            expect($state.go).toHaveBeenCalledWith('bd.products.servicesetup');
            expect(loadingSpinnerService.start).toHaveBeenCalled();
            expect(loadingSpinnerService.finish).toHaveBeenCalled();
        });

        it('should stop the loading spinner and display the debit card declaration modal if a debit card has been selected', function () {

            var submitResponse = {
                orderNumber: 1,
                version: 2
            };

            var postStateChangeResponse = {
                headers: function () {
                    return {'e-tag': '2'};
                },
                data: {
                    code: '9003'
                }
            };

            spyOn(offersAndFeesService, 'isUserFromCallCenter').and.returnValue(false);
            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.when([submitResponse]));
            spyOn(accountConfigurationService, 'triggerPOStateChange').and.returnValue($q.when(postStateChangeResponse));
            spyOn($state, 'go').and.callFake(angular.noop);
            spyOn(modal, 'showCardDeclarationModal');

            var ctrl = createController();
            ctrl.model = {};
            ctrl.model.cardSelected = {
                cardtype: 'ANZAccessVisaDebit'
            };
            //real call
            ctrl.submitProductApplication();
            scope.$apply();

            expect(loadingSpinnerService.finish).toHaveBeenCalled();
            expect(modal.showCardDeclarationModal).toHaveBeenCalled();
        });

        it('should not call the card declaration modal if user is from Call Center', function () {

            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.when({}));
            spyOn(modal, 'showCardDeclarationModal');
            spyOn(offersAndFeesService, 'isUserFromCallCenter').and.returnValue(true);
            var ctrl = createController();

            ctrl.model = {};
            ctrl.model.cardSelected = {
                cardtype: 'ANZAccessVisaDebit'
            };
            //real call
            ctrl.submitProductApplication();
            scope.$apply();

            expect(modal.showCardDeclarationModal).not.toHaveBeenCalled();
            expect(accountConfigurationService.submitApplication).toHaveBeenCalled();
        });

        it('should not display the debit card declaration modal if a debit card has not been selected', function () {

            var submitResponse = {
                orderNumber: 1,
                version: 2
            };

            var postStateChangeResponse = {
                headers: function () {
                    return {'e-tag': '2'};
                },
                data: {
                    code: '9003'
                },
                status: 200,
                orderId: 1
            };

            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.when([submitResponse]));
            spyOn(accountConfigurationService, 'triggerPOStateChange').and.returnValue($q.when(postStateChangeResponse));
            spyOn($state, 'go').and.callFake(angular.noop);
            spyOn(modal, 'showCardDeclarationModal');
            spyOn(shoppingCartService, 'finalizeItem').and.returnValue($q.when({}));
            spyOn(needsDataService, 'updateCartCount');

            var ctrl = createController();
            ctrl.model = {};
            ctrl.submitProductApplication();
            scope.$apply();

            expect(modal.showCardDeclarationModal).not.toHaveBeenCalled();
        });

        it('should update declarations when required', function () {
            var declarationFromModal = {
                declarationID: 1,
                declarationItem: 'I/we request that ANZ issue me/us with a debit card to access my/our account(s)'
            };
            var declarations = [declarationFromModal];

            var ctrl = createController();
            ctrl.updateDeclarations(declarationFromModal);

            expect(loadingSpinnerService.start).toHaveBeenCalled();
            expect(ctrl.model.declarations).toEqual(declarations);
            expect(ctrl.warningFromServer.warnings.length).toEqual(0);
            expect(ctrl.warningFromServer.errors.length).toEqual(0);
        });

        it('should display spinner and stay on the page when state post is not successful', function () {

            var submitResponse = {
                orderNumber: 1,
                version: 2
            };

            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.when([submitResponse]));
            spyOn(accountConfigurationService, 'triggerPOStateChange').and.returnValue($q.reject(500));
            spyOn($state, 'go').and.callFake(angular.noop);

            var ctrl = createController(bdConfigurationDisabled);
            //real call
            ctrl.submitProductApplication();
            scope.$apply();

            expect(accountConfigurationService.submitApplication).toHaveBeenCalledWith(dataModel, ctrl.model);
            expect(accountConfigurationService.triggerPOStateChange).toHaveBeenCalledWith(submitResponse.orderNumber);
            expect($state.go).not.toHaveBeenCalled();
            expect(loadingSpinnerService.start).toHaveBeenCalled();
            expect(loadingSpinnerService.finish).toHaveBeenCalled();
        });

        it('should show error popup when there is 9068 fatal error with submitting the application', function () {

            var submitResponse = {
                orderNumber: 1,
                version: 2
            };

            var fatalErrorMsg = {
                'data': {
                    'code': '9068',
                    description: 'All accounts have failed to open. Please retry account opening.'
                },
                status: 500,
                orderId: 1
            };

            var mockErrorMsgForPopup = {
                status: 500,
                data: {
                    displayMessage: 'All accounts have failed to open. Please retry account opening.',
                    errorsData: [
                        {
                            name: 'Some product name',
                            warningList: [
                                {
                                    code: '9068',
                                    message: 'An error has occurred whilst creating account. The provided postcode, suburb and state is incorrect, please correct the address and resubmit.'
                                }
                            ]
                        }
                    ]
                }
            };

            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.when([submitResponse]));
            spyOn(accountConfigurationService, 'triggerPOStateChange').and.returnValue($q.when(fatalErrorMsg));
            spyOn(rootScope, '$broadcast').and.returnValue({preventDefault: true});
            spyOn($state, 'go').and.callFake(angular.noop);

            var ctrl = createController(bdConfigurationDisabled);
            //real call
            ctrl.submitProductApplication();
            scope.$apply();

            expect(accountConfigurationService.submitApplication).toHaveBeenCalledWith(dataModel, ctrl.model);
            expect(accountConfigurationService.triggerPOStateChange).toHaveBeenCalledWith(submitResponse.orderNumber);
            expect($state.go).not.toHaveBeenCalled();
            expect(rootScope.$broadcast).toHaveBeenCalledWith('errorModalOpened', mockErrorMsgForPopup);
            expect(ctrl.warningFromServer.errors.length).toEqual(1);
        });

        it('should show error popup when there is 9061 fatal error with submitting the application', function () {

            var submitResponse = {
                orderNumber: 1,
                version: 2
            };

            var fatalErrorMsg = {
                'data': {
                    'code': '9061',
                    description: 'All accounts have failed to open. Please retry account opening.'
                },
                status: 500,
                orderId: 1,
            };

            var mockErrorMsgForPopup = {
                status: 500,
                data: {
                    displayMessage: 'All accounts have failed to open. Please retry account opening.',
                    errorsData: [
                        {
                            name: 'Some product name',
                            warningList: [
                                {
                                    code: '9061',
                                    message: 'An error has occurred whilst creating account. Please resubmit.'
                                }
                            ]
                        }
                    ]
                }
            };

            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.when([submitResponse]));
            spyOn(accountConfigurationService, 'triggerPOStateChange').and.returnValue($q.when(fatalErrorMsg));
            spyOn(rootScope, '$broadcast').and.returnValue({preventDefault: true});
            spyOn($state, 'go').and.callFake(angular.noop);

            var ctrl = createController(bdConfigurationDisabled);
            //real call
            ctrl.submitProductApplication();
            scope.$apply();

            expect(accountConfigurationService.submitApplication).toHaveBeenCalledWith(dataModel, ctrl.model);
            expect(accountConfigurationService.triggerPOStateChange).toHaveBeenCalledWith(submitResponse.orderNumber);
            expect($state.go).not.toHaveBeenCalled();
            expect(rootScope.$broadcast).toHaveBeenCalledWith('errorModalOpened', mockErrorMsgForPopup);
            expect(ctrl.warningFromServer.errors.length).toEqual(1);
        });

        it('should add warning msg when service return warning 9063', function () {

            var submitResponse = {
                orderNumber: 1,
                version: 2
            };

            var warningmsg = {
                'data': {
                    'code': '9063',
                    'description': null,
                    'location': 'CSP-PO',
                    'message': 'Failed to link one or more CRNs: 100100102',
                    'severity': 'High'
                },
                status: 200,
                orderId: 1
            };

            var mockWarningForDisplay = {
                errors: [],
                warnings: [{
                    name: 'Some product name',
                    warningList: [{
                        code: '9063',
                        message: 'An error has occurred whilst linking account to CRN. Please retry in iKnow.'
                    }]
                }]
            };

            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.when([submitResponse]));
            spyOn(accountConfigurationService, 'triggerPOStateChange').and.returnValue($q.when(warningmsg));
            spyOn(shoppingCartService, 'finalizeItem').and.returnValue($q.when({}));
            spyOn(needsDataService, 'updateCartCount');
            spyOn($state, 'go').and.callFake(angular.noop);
            spyOn(dataStoreService, 'setError');

            var ctrl = createController(bdConfigurationDisabled);
            //real call
            ctrl.submitProductApplication();
            scope.$apply();

            expect(accountConfigurationService.submitApplication).toHaveBeenCalledWith(dataModel, ctrl.model);
            expect(accountConfigurationService.triggerPOStateChange).toHaveBeenCalledWith(submitResponse.orderNumber);
            expect($state.go).toHaveBeenCalled();
            expect(dataStoreService.setError).toHaveBeenCalledWith({errorsWarningsForDisplay: mockWarningForDisplay});
            expect(loadingSpinnerService.start).toHaveBeenCalled();
            expect(loadingSpinnerService.finish).toHaveBeenCalled();
        });

        it('should display spinner, do not call post order state and stay on the same page when submit application call is not successful', function () {
            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.reject(500));
            spyOn(accountConfigurationService, 'triggerPOStateChange');
            spyOn($state, 'go');

            var ctrl = createController(bdConfigurationDisabled);
            //real call
            ctrl.submitProductApplication();
            scope.$apply();

            expect(accountConfigurationService.submitApplication).toHaveBeenCalledWith(dataModel, ctrl.model);
            expect(accountConfigurationService.triggerPOStateChange).not.toHaveBeenCalled();
            expect($state.go).not.toHaveBeenCalled();
            expect(loadingSpinnerService.start).toHaveBeenCalled();
            expect(loadingSpinnerService.finish).toHaveBeenCalled();
        });

        it('should show the error popup and block the submission when the service returns 9069', function () {

            var submitResponse = {
                orderNumber: 1,
                version: 2
            };

            var fatalErrorMsg = {
                data: {
                    code: '9069',
                    description: 'All accounts have failed to open. Please retry account opening.'
                },
                status: 500,
                orderId: 1
            };

            var mockErrorMsgForPopup = {
                status: 500,
                data: {
                    displayMessage: 'All accounts have failed to open. Please retry account opening.',
                    errorsData: [
                        {
                            name: 'Some product name',
                            warningList: [
                                {
                                    code: '9069',
                                    message: 'An error has occurred whilst creating account. The BSB provided is incorrect, please correct the BSB and resubmit.'
                                }
                            ]
                        }
                    ]
                }
            };

            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.when([submitResponse]));
            spyOn(accountConfigurationService, 'triggerPOStateChange').and.returnValue($q.when(fatalErrorMsg));
            spyOn(rootScope, '$broadcast').and.returnValue({preventDefault: true});
            spyOn($state, 'go').and.callFake(angular.noop);

            var ctrl = createController(bdConfigurationDisabled);
            //real call
            ctrl.submitProductApplication();
            scope.$apply();

            expect(accountConfigurationService.submitApplication).toHaveBeenCalledWith(dataModel, ctrl.model);
            expect(accountConfigurationService.triggerPOStateChange).toHaveBeenCalledWith(submitResponse.orderNumber);
            expect($state.go).not.toHaveBeenCalled();
            expect(rootScope.$broadcast).toHaveBeenCalledWith('errorModalOpened', mockErrorMsgForPopup);
            expect(ctrl.warningFromServer.errors.length).toEqual(1);
        });

        it('should process all warnings and show the error popup when submit application returns an error response and at least one success response', function () {

            var submitResponse = [
                {orderNumber: 1, version: 2},
                {orderNumber: 2, version: 2}
            ];

            var mockErrorResponse = {
                headers: function () {
                    return {'e-tag': '2'};
                },
                status: 501,
                orderId: 1,
                data: {code: '9068'}
            };

            var mockSuccessResponse = {
                headers: function () {
                    return {'e-tag': '2'};
                },
                status: 200,
                orderId: 1,
                data: {code: '9062'}
            };

            var mockWarningForDisplay = {
                errors: [{
                    name: 'Some product name',
                    warningList: [{
                        code: '9068',
                        message: 'An error has occurred whilst creating account. The provided postcode, suburb and state is incorrect, please correct the address and resubmit.'
                    }]
                }],
                warnings: [{
                    name: 'Some product name',
                    warningList: [{
                        code: '9062',
                        message: 'An error has occurred whilst creating CRN. Please retry in iKnow.'
                    }]
                }]
            };

            var mockDataForPopup = [
                {
                    name: 'Some product name',
                    warningList: [{
                        code: '9068',
                        message: 'An error has occurred whilst creating account. The provided postcode, suburb and state is incorrect, please correct the address and resubmit.'
                    }]
                }
            ];
            var mockErrorMsgForPopup = {
                status: 500,
                data: {
                    displayMessage: 'At least one account has failed to open. Please complete set-up, then retry account opening via to-do list.',
                    errorsData: mockDataForPopup
                }
            };

            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.when(submitResponse));
            spyOn(accountConfigurationService, 'triggerPOStateChange').and.returnValues($q.when(mockErrorResponse), $q.when(mockSuccessResponse));
            spyOn(shoppingCartService, 'finalizeItem').and.returnValue($q.when({}));
            spyOn(needsDataService, 'updateCartCount');
            spyOn($state, 'go').and.callFake(angular.noop);
            spyOn(dataStoreService, 'setError');
            spyOn(rootScope, '$broadcast').and.returnValue({preventDefault: true});

            var ctrl = createController(bdConfigurationDisabled);
            //real call
            ctrl.submitProductApplication();
            scope.$apply();

            expect(accountConfigurationService.submitApplication).toHaveBeenCalledWith(dataModel, ctrl.model);
            expect(accountConfigurationService.triggerPOStateChange.calls.count()).toBe(2);
            expect(shoppingCartService.finalizeItem).toHaveBeenCalledWith(1, 1);
            expect(needsDataService.updateCartCount).toHaveBeenCalled();
            expect($state.go).toHaveBeenCalledWith('bd.products.servicesetup');
            expect(loadingSpinnerService.start).toHaveBeenCalled();
            expect(loadingSpinnerService.finish).toHaveBeenCalled();
            expect(dataStoreService.setError).toHaveBeenCalledWith({errorsWarningsForDisplay: mockWarningForDisplay});
            expect(rootScope.$broadcast).toHaveBeenCalledWith('errorModalOpened', mockErrorMsgForPopup);
            expect(ctrl.warningFromServer.errors.length).not.toEqual(0);
            expect(ctrl.warningFromServer.warnings.length).not.toEqual(0);
        });

        it('should process all warning messages when applicaton submit returns multiple warnings for the same account', function () {
            // given
            var submitResponse = {
                orderNumber: 1,
                version: 2
            };

            var warningmsg = {
                'data': [
                    {
                        'code': '9062',
                        'description': null,
                        'location': 'CSP-PO',
                        'message': 'An error occurred as part of the Create welcome plugin',
                        'severity': 'High'
                    },
                    {
                        'code': '9063',
                        'description': null,
                        'location': 'CSP-PO',
                        'message': 'An error occurred as part of Link account plugin',
                        'severity': 'High'
                    }
                ],
                status: 200,
                orderId: 1
            };

            var mockWarningForDisplay = {
                errors: [],
                warnings: [{
                    name: 'Some product name',
                    warningList: [
                        {
                            code: '9062',
                            message: 'An error has occurred whilst creating CRN. Please retry in iKnow.'
                        },
                        {
                            code: '9063',
                            message: 'An error has occurred whilst linking account to CRN. Please retry in iKnow.'
                        }
                    ]
                }]
            };

            spyOn(accountConfigurationService, 'submitApplication').and.returnValue($q.when([submitResponse]));
            spyOn(accountConfigurationService, 'triggerPOStateChange').and.returnValue($q.when(warningmsg));
            spyOn(shoppingCartService, 'finalizeItem').and.returnValue($q.when({}));
            spyOn(needsDataService, 'updateCartCount');
            spyOn($state, 'go').and.callFake(angular.noop);
            spyOn(dataStoreService, 'setError');

            var ctrl = createController(bdConfigurationDisabled);
            //real call
            ctrl.submitProductApplication();
            scope.$apply();

            //then
            expect(accountConfigurationService.submitApplication).toHaveBeenCalledWith(dataModel, ctrl.model);
            expect(accountConfigurationService.triggerPOStateChange).toHaveBeenCalledWith(submitResponse.orderNumber);
            expect($state.go).toHaveBeenCalled();
            expect(dataStoreService.setError).toHaveBeenCalledWith({errorsWarningsForDisplay: mockWarningForDisplay});
            expect(loadingSpinnerService.start).toHaveBeenCalled();
            expect(loadingSpinnerService.finish).toHaveBeenCalled();
        });

        it('should populate fees and campaign fields', function () {
            // given
            var dataModelWithOffers = {
                customerProfiles: [{
                    individual: {
                        externalCustomerNames: [
                            {
                                externalSystem: 'CAP CIS',
                                name: 'PERSONAL CUSTOMER TEST02'
                            }
                        ],
                        cspCustomerId: 1
                    }
                }],
                orders: [{
                    productBundles: [{
                        productId: '1234'
                    }],
                    cartId: 1,
                    id: 1,
                    orderId: '1',
                    offersForSubmit: [
                        {
                            type: 'feeWaiver',
                            svcChargeCode: 'a',
                            feeWaiverCode: 'a',
                            feeWaiverEndDate: 'a',
                            transactionEventCode: '',
                            bonusInterestCode: '',
                            salesCampaignCode: '',
                            campaignInterestCode: ''
                        },
                        {
                            type: 'offer',
                            svcChargeCode: '',
                            feeWaiverCode: '',
                            feeWaiverEndDate: '',
                            transactionEventCode: 'b',
                            bonusInterestCode: 'b',
                            salesCampaignCode: 'b',
                            campaignInterestCode: 'b'
                        }
                    ]
                }]
            };
            dataStoreService.getData = jasmine.createSpy().and.returnValue(dataModelWithOffers);

            var ctrl = createController();

            // when
            ctrl.submitProductApplication();

            // then
            expect(ctrl.model.feeListByOrderMap).toEqual({
                1: [{feeType: 'a', feeWaiverReasonCode: 'a', feeWaiverEndDate: 'a'}]
            });
            expect(ctrl.model.campaignListByOrderMap).toEqual({
                1: [{transactionEventCode: 'b', bonusInterestCode: 'b', campaignCode: 'b', campaignInterestCode: 'b'}]
            });
        });

        it('should not populate fees when the offer type is not a feeWaiver', function () {
            // given
            var dataModelWithOffers = {
                customerProfiles: [{
                    individual: {
                        externalCustomerNames: [
                            {
                                externalSystem: 'CAP CIS',
                                name: 'PERSONAL CUSTOMER TEST02'
                            }
                        ],
                        cspCustomerId: 1
                    }
                }],
                orders: [{
                    productBundles: [{
                        productId: '1234'
                    }],
                    cartId: 1,
                    id: 1,
                    orderId: '1',
                    offersForSubmit: [
                        {
                            type: 'offer',
                            svcChargeCode: '',
                            feeWaiverCode: '',
                            feeWaiverEndDate: '',
                            transactionEventCode: 'b',
                            bonusInterestCode: 'b',
                            salesCampaignCode: 'b',
                            campaignInterestCode: 'b'
                        },
                        {
                            type: 'campaign',
                            svcChargeCode: '',
                            feeWaiverCode: '',
                            feeWaiverEndDate: '',
                            transactionEventCode: 'c',
                            bonusInterestCode: 'c',
                            salesCampaignCode: 'c',
                            campaignInterestCode: 'c'
                        }
                    ]
                }
                ]
            };
            dataStoreService.getData = jasmine.createSpy().and.returnValue(dataModelWithOffers);
            // when
            var ctrl = createController();
            ctrl.submitProductApplication();

            // then
            expect(ctrl.model.feeListByOrderMap).toEqual({1: []});
            expect(ctrl.model.campaignListByOrderMap).toEqual({
                1: [
                    {transactionEventCode: 'b', bonusInterestCode: 'b', campaignCode: 'b', campaignInterestCode: 'b'},
                    {transactionEventCode: 'c', bonusInterestCode: 'c', campaignCode: 'c', campaignInterestCode: 'c'}
                ]
            });
        });

        it('should not populate campaigns when offer type is not a campaign or an offer', function () {
            // given
            var dataModelWithOffers = {
                customerProfiles: [{
                    individual: {
                        externalCustomerNames: [
                            {
                                externalSystem: 'CAP CIS',
                                name: 'PERSONAL CUSTOMER TEST02'
                            }
                        ],
                        cspCustomerId: 1
                    }
                }],
                orders: [{
                    productBundles: [{
                        productId: '1234'
                    }],
                    cartId: 1,
                    id: 1,
                    orderId: '1',
                    offersForSubmit: [
                        {
                            type: 'feeWaiver',
                            svcChargeCode: 'a',
                            feeWaiverCode: 'a',
                            feeWaiverEndDate: 'a',
                            transactionEventCode: '',
                            bonusInterestCode: '',
                            salesCampaignCode: '',
                            campaignInterestCode: ''
                        },
                        {
                            type: 'feeWaiver',
                            svcChargeCode: 'b',
                            feeWaiverCode: 'b',
                            feeWaiverEndDate: 'b',
                            transactionEventCode: '',
                            bonusInterestCode: '',
                            salesCampaignCode: '',
                            campaignInterestCode: ''
                        }
                    ]
                }
                ]
            };
            dataStoreService.getData = jasmine.createSpy().and.returnValue(dataModelWithOffers);
            var ctrl = createController();

            // when
            ctrl.submitProductApplication();

            // then
            expect(ctrl.model.feeListByOrderMap).toEqual({
                1: [
                    {feeType: 'a', feeWaiverReasonCode: 'a', feeWaiverEndDate: 'a'},
                    {feeType: 'b', feeWaiverReasonCode: 'b', feeWaiverEndDate: 'b'}
                ]
            });
            expect(ctrl.model.campaignListByOrderMap).toEqual({1: []});
        });

        it('should populate campaigns and offers for feeWaiverAndOffer types', function () {
            // given
            var dataModelWithOffers = {
                customerProfiles: [{
                    individual: {
                        externalCustomerNames: [
                            {
                                externalSystem: 'CAP CIS',
                                name: 'PERSONAL CUSTOMER TEST02'
                            }
                        ],
                        cspCustomerId: 1
                    }
                }],
                orders: [{
                    productBundles: [{
                        productId: '1234'
                    }],
                    cartId: 1,
                    id: 1,
                    orderId: '1',
                    offersForSubmit: [
                        {
                            type: 'feeWaiverAndOffer',
                            svcChargeCode: 'a',
                            feeWaiverCode: 'a',
                            feeWaiverEndDate: 'a',
                            transactionEventCode: 'a',
                            bonusInterestCode: 'a',
                            salesCampaignCode: 'a',
                            campaignInterestCode: 'a'
                        }
                    ]
                }
                ]
            };
            dataStoreService.getData = jasmine.createSpy().and.returnValue(dataModelWithOffers);
            var ctrl = createController();

            // when
            ctrl.submitProductApplication();

            // then
            expect(ctrl.model.feeListByOrderMap).toEqual({
                1: [
                    {feeType: 'a', feeWaiverReasonCode: 'a', feeWaiverEndDate: 'a'}
                ]
            });
            expect(ctrl.model.campaignListByOrderMap).toEqual({
                1: [
                    {transactionEventCode: 'a', bonusInterestCode: 'a', campaignCode: 'a', campaignInterestCode: 'a'}
                ]
            });
        });
    });

    describe('Card selection for multiproduct', function () {
        var dataModelMultiProduct = {
            customerProfiles: [{
                individual: {
                    externalCustomerNames: [
                        {
                            externalSystem: 'CAP CIS',
                            name: 'PERSONAL CUSTOMER TEST02'
                        }
                    ],
                    cspCustomerId: 1
                }
            }],
            orders: [{
                productBundles: [{
                    productId: '1234',
                    name: 'Some product name'
                }],
                cartId: 1,
                id: 1,
                orderId: '1',
                orderPriority: 3
            }, {
                productBundles: [{
                    productId: '4321',
                    name: 'Some product name'
                }],
                cartId: 2,
                id: 2,
                orderId: '2',
                orderPriority: 1
            }]
        };

        it('should set up orderCardInfo to highest in orderPriority', function () {
            dataStoreService.getData = jasmine.createSpy().and.returnValues(dataModelMultiProduct);
            productService.getProductById = jasmine.createSpy().and.returnValue({});
            var ctrl = createController();
            expect(productService.getProductById).toHaveBeenCalledWith('4321');

            expect(ctrl.displayOrderCard).toEqual(true);
            expect(ctrl.model.orderCardInfo).toEqual(features);
        });

        it('should set up orderCardInfo to nothing, if there is no order card feature defined for order with highest orderPriority', function () {
            dataStoreService.getData = jasmine.createSpy().and.returnValue(dataModelMultiProduct);
            productService.getProductById = jasmine.createSpy().and.returnValue({});
            productService.getFeatureByFeatureType = jasmine.createSpy().and.callFake(function (product, featureType) {
                if (featureType === 'orderCard') {
                    return undefined;
                }
                return {};
            });

            var ctrl = createController();
            expect(productService.getProductById).toHaveBeenCalledWith('4321');

            expect(ctrl.displayOrderCard).toEqual(false);
            expect(ctrl.model.orderCardInfo).toBeUndefined();
        });

    });
});
