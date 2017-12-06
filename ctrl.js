'use strict';
module.exports = ['$scope', '$state', 'dataStoreService', 'personalSituationFormMapper', 'bdConfiguration',
    'productService', 'addressFormatter', 'buanaService', 'modal', 'accountConfigurationService', 'utils', 'workflow',
    '$rootScope', 'shoppingCartService', 'offersAndFeesService', 'loadingSpinnerService', 'needsDataService', 'dataService',
    'language', '$q', 'sessionDataStoreService', 'referenceDataService', 'customerService',
    function ($scope, $state, dataStoreService, personalSituationFormMapper, bdConfiguration, productService,
              addressFormatter, buanaService, modal, accountConfigurationService, utils, workflow, $rootScope, shoppingCartService, offersAndFeesService,
              loadingSpinnerService, needsDataService, dataService, language, $q, sessionDataStoreService, referenceDataService,
              customerService) {

        $scope.products.stepper = '1';

        var vm = this;
        vm.model = {};
        vm.submitProductApplication = submitProductApplication;
        vm.showCrnSelectModal = showCrnSelectModal;
        vm.updateSelectedCrns = updateSelectedCrns;
        vm.updateSelectedCard = updateSelectedCard;
        vm.back = back;
        vm.getOrderCardInfoByProductId = getOrderCardInfoByProductId;
        vm.showCardSelectModal = showCardSelectModal;
        vm.getImage = getImage;
        vm.removeCardSelection = removeCardSelection;
        vm.isAustralianAddress = true;
        vm.updateDeclarations = updateDeclarations;
        vm.showCardConsentModal = showCardConsentModal;
        vm.confirmConsentReceived = confirmConsentReceived;
        vm.selectCard = selectCard;
        vm.accountSubmitFailed = false;
        vm.disableAddCard = disableAddCard;
        vm.applicants = sessionDataStoreService.getDataByKey('applicants');

        var dataModel = dataStoreService.getData();
        var originator = dataService.getAssessmentDataByPath('originator');
        var isCallCentreBanker = offersAndFeesService.isUserFromCallCenter(originator.channelType);

        vm.model.customerData = [];
        _.forEach(dataModel.customerProfiles, (profile) => {
            let emailAddress = personalSituationFormMapper.extractEmailAddress(profile);
        let mailingAddress = personalSituationFormMapper.extractMailingAddress(profile);
        vm.model.customerData.push({
            firstName: personalSituationFormMapper.extractFirstName(profile),
            fullName: personalSituationFormMapper.extractFullName(profile),
            mailingAddress,
            emailAddress,
            isAustralianAddress: (mailingAddress && mailingAddress.country === 'AU'),
            bankStatementTo: bankStatementConfiguration(emailAddress, mailingAddress)
        });
    });

        fetchProducts();
        fetchAccountRelationship();
        getOrderCardInfoByProductId();
        updateSelectedCard({});

        if (!dataModel.crnsInfoCollection) {
            loadingSpinnerService.start();
            buanaService.getCrns(dataModel.customerProfiles[0].individual.cspCustomerId).then(function (response) {
                dataModel.crnsInfoCollection = response;
                initialiseViewModel(true);
            })['finally'](function () {
                loadingSpinnerService.finish();
            });
        } else {
            initialiseViewModel(false);
        }

        /** Populate crn info into model view */
        function initialiseViewModel(firstVisit) {
            vm.model.crnsInfoCollection = dataModel.crnsInfoCollection;
            vm.model.crnsAvailable = dataModel.crnsInfoCollection && !_.isEmpty(dataModel.crnsInfoCollection);
            vm.model.cardSelected = dataModel.cardSelected;
            updateSelectedCrns(dataModel.crnsInfoCollection);

            if (firstVisit && vm.model.crnsSelected || dataModel.crnsPreselected) {
                vm.model.crnsPreselected = true;
            }
        }

        /**
         * ProductService to get Product and get the eStatementFeature,
         * to check Product supports eStatements.
         * @returns boolean value
         */
        function iseStatementAvailableForAllProducts() {
            var eStatementAvailable = true;
            _.forEach(dataModel.orders, function (order) {
                var product = productService.getProductById(order.productBundles[0].productId);
                var eStatementFeature = productService.getFeatureByFeatureType(product, 'estatementAvailable');
                if (!eStatementFeature || eStatementFeature.value !== 'Y') {
                    eStatementAvailable = false;
                }
            });
            return eStatementAvailable;
        }

        function fetchProducts() {
            vm.products = [];
            _.forEach(dataModel.orders, function (order) {
                let product = productService.getProductById(order.productBundles[0].productId);
                console.log('Product: ', product);
                vm.products.push(product);
            });
        }

        function fetchAccountRelationship() {

            let promises = {
                accountRelationshipCombos: referenceDataService.getReferenceValueByProperty('com.anz.csp.bd.accountRelationshipCombo'),
                accountRelationshipTypes: referenceDataService.getReferenceValueByProperty('com.anz.csp.bd.accountRelationshipType')
            };

            vm.applicantsCombos = [];
            $q.all(promises).then(function (applicantDetails) {
                let filteredCombos = filterCombosByApplicantsNumber(applicantDetails.accountRelationshipCombos.values, vm.applicants.length);

                if (vm.applicants.length === 1) {
                    vm.applicantsCombos.push({
                        fullName: vm.applicants[0].fullName,
                        accountRelationship: getAccountRelationshipDesc(applicantDetails.accountRelationshipTypes.values,
                            filteredCombos[0].primaryApplicant.code)
                    });
                } else if (vm.applicants.length === 2) {

                    fetchApplicantProfiles()
                        .then(function (applicantProfiles) {
                            let secondApplicantAge = utils.getAgeAsOfToday(applicantProfiles[1].dateOfBirth);
                            angular.forEach(filteredCombos, function (combo) {
                                let isAgeEligible = combo.secondApplicant.eligibleAge <= secondApplicantAge;
                                if (combo.default) {
                                    if (isAgeEligible === combo.secondApplicant.isAgeEligible) {
                                        addApplicantCombo(applicantProfiles[0], combo.primaryApplicant.code, applicantDetails);
                                        addApplicantCombo(applicantProfiles[1], combo.secondApplicant.code, applicantDetails);
                                    }
                                }
                            });
                        });
                } else {
                    fetchApplicantProfiles()
                        .then(function (applicantProfiles) {
                            let secondApplicantAge = utils.getAgeAsOfToday(applicantProfiles[1].dateOfBirth);
                            let thirdApplicantAge = utils.getAgeAsOfToday(applicantProfiles[2].dateOfBirth);
                            angular.forEach(filteredCombos, function (combo) {
                                let isSecondApplicantAgeEligible = combo.secondApplicant.eligibleAge <= secondApplicantAge;
                                let isThirdApplicantAgeEligible = combo.thirdApplicant.eligibleAge <= thirdApplicantAge;

                                if (combo.default) {
                                    if (isSecondApplicantAgeEligible === combo.secondApplicant.isAgeEligible &&
                                        isThirdApplicantAgeEligible === combo.thirdApplicant.isAgeEligible) {
                                        addApplicantCombo(applicantProfiles[0], combo.primaryApplicant.code, applicantDetails);
                                        addApplicantCombo(applicantProfiles[1], combo.secondApplicant.code, applicantDetails);
                                        addApplicantCombo(applicantProfiles[2], combo.thirdApplicant.code, applicantDetails);
                                    }
                                }
                            });
                        });
                }
            });
        }

        function addApplicantCombo(applicantProfile, code, applicantDetails) {
            vm.applicantsCombos.push({
                fullName: applicantProfile.firstName + ' ' + applicantProfile.lastName,
                accountRelationship: getAccountRelationshipDesc(applicantDetails.accountRelationshipTypes.values, code)
            });
        }

        function fetchApplicantProfiles() {
            let fetchApplicantProfiles = [];
            _.forEach(vm.applicants, function (applicant) {
                fetchApplicantProfiles.push(customerService.getCustomer(applicant.capId));
            });

            return $q.all(fetchApplicantProfiles);
        }

        function filterCombosByApplicantsNumber(combos, applicantsNumber) {
            let results = [];
            angular.forEach(combos, function (combo) {
                if (combo.applicantsNumber === applicantsNumber) {
                    results.push(combo);
                }
            });
            return results;
        }

        /**
         * Get the account relationship type description for a given code
         * @param types - list of available relationship types
         * @param code - relationship type requested
         * @returns {string} relationship type description
         */
        function getAccountRelationshipDesc(types, code) {
            let description = '';

            angular.forEach(types, function (type) {
                if (code === type.code) {
                    description = type.description;
                }
            });

            return description;
        }

        /**
         * Return bdConfiguration Enable_E_Statement,
         * to check whether EStatement toggle is ON or OFF.
         * @returns boolean value
         */
        function iseStatementAvailableforBD() {
            return bdConfiguration && bdConfiguration.ENABLE_E_STATEMENT;
        }

        // product has estatement and reference and email available then email or address
        /**
         * Check whether email Address available for customer,
         * Product supports eStatements
         * EStatement toggle is ON or OFF.
         * @returns String value, Email address or mailing address
         */
        function bankStatementConfiguration(emailAddress, mailingAddress) {
            if (emailAddress && iseStatementAvailableforBD() && iseStatementAvailableForAllProducts()) {
                return emailAddress;
            } else {
                return addressFormatter.formatAddressAsString(mailingAddress);
            }
        }

        //close modal function, used by all forms
        function showCrnSelectModal() {
            modal.selectCrnsModal('bd.products.configuration', {
                crnsInfoList: vm.model.crnsInfoCollection
            }, vm.updateSelectedCrns);
        }

        function updateSelectedCrns(selectedCrnsFromModal) {
            vm.model.crnsInfoCollection = selectedCrnsFromModal;
            vm.model.designatedCrns = _.filter(selectedCrnsFromModal, function (crnInfo) {
                return (crnInfo.designated === true);
            });
            vm.model.crnsSelected = vm.model.designatedCrns && !_.isEmpty(vm.model.designatedCrns);
        }

        function showCardConsentModal() {
            modal.cardConsentModal(vm.confirmConsentReceived);
        }

        function confirmConsentReceived() {
            showCardSelectModal();
        }

        function selectCard() {
            if (isCallCentreBanker) {
                showCardConsentModal();
            } else {
                showCardSelectModal();
            }
        }

        function setViewValuetoDataModel() {
            dataModel.crnsPreselected = vm.model.crnsPreselected;
            dataModel.crnsInfoCollection = vm.model.crnsInfoCollection;
            dataModel.cardSelected = vm.model.cardSelected;
        }

        function back() {
            setViewValuetoDataModel();
            $state.go('bd.products.application', {isComingBack: true, dataModel: dataStoreService.getData()});
        }

        /* Function to populate fee and campaign information to vm.model, which
         * will be eventually populated to application model to Origination service
         */
        function populateFeeAndCampaignToModel() {
            vm.model.feeListByOrderMap = {};
            vm.model.campaignListByOrderMap = {};

            angular.forEach(dataModel.orders, function (order) {
                var feeList = [];
                var campaignList = [];

                angular.forEach(order.offersForSubmit, function (offer) {

                    // If offer type is feeWaiver, transmit the fee item to the order.
                    // If offer type is campaign or offer, transmit the campaign item to the order.
                    // If offer type is feeWaiverAndOffer, transmit the fee and campaign item to the order.
                    if (offer.type === 'feeWaiver' || offer.type === 'feeWaiverAndOffer') {
                        feeList.push({
                            feeType: offer.svcChargeCode,
                            feeWaiverReasonCode: offer.feeWaiverCode,
                            feeWaiverEndDate: offer.feeWaiverEndDate
                        });
                    }
                    if (offer.type === 'campaign' || offer.type === 'offer' || offer.type === 'feeWaiverAndOffer') {
                        campaignList.push({
                            transactionEventCode: offer.transactionEventCode,
                            bonusInterestCode: offer.bonusInterestCode,
                            campaignCode: offer.salesCampaignCode,
                            campaignInterestCode: offer.campaignInterestCode
                        });
                    }
                });

                vm.model.feeListByOrderMap[order.orderId] = feeList;
                vm.model.campaignListByOrderMap[order.orderId] = campaignList;

            });
        }

        var warningMsgs = [
            {code: '9062', message: 'An error has occurred whilst creating CRN. Please retry in iKnow.'},
            {code: '9063', message: 'An error has occurred whilst linking account to CRN. Please retry in iKnow.'},
            {
                code: '9064',
                message: 'An error has occurred whilst notifying Siebel of the account creation. Please retry in iKnow.'
            },
            {code: '9065', message: 'Generation of welcome documents unsuccessful.'},
            {code: '9066', message: 'An error has occurred whilst ordering card. Please retry in iKnow.'},
            {code: '9067', message: 'An error has occurred whilst verifying the customer KYC status. Please retry in iKnow.'},
            {code: '9061', message: 'An error has occurred whilst creating account. Please resubmit.'},
            {
                code: '9068',
                message: 'An error has occurred whilst creating account. The provided postcode, suburb and state is incorrect, please correct the address and resubmit.'
            },
            {
                code: '9069',
                message: 'An error has occurred whilst creating account. The BSB provided is incorrect, please correct the BSB and resubmit.'
            },
            {
                code: '9002',
                message: 'An error has occurred whilst creating account. The submitted order does not meet the required specifications, please correct the data and resubmit.'
            }
        ];

        function updateDeclarations(declarationFromModal) {
            loadingSpinnerService.start();
            var declarations = [];
            declarations.push(declarationFromModal);
            vm.model.declarations = declarations;

            continueToSubmit();
        }

        function shouldCardDeclarationBeDisplayed(continueToSubmit) {
            if (!isCallCentreBanker && vm.model.cardSelected) {
                loadingSpinnerService.finish();
                modal.showCardDeclarationModal({}, vm.updateDeclarations);
            } else {
                continueToSubmit();
            }
        }

        var hasWarnings = function (result) {
            return result && result.data;
        };

        function getProductByOrderId(warningOrderId) {
            var orderByWarningId = _.find(dataModel.orders, function (order) {
                return order.orderId === warningOrderId;
            });

            return orderByWarningId.productBundles[0].name;
        }

        vm.warningFromServer = {
            errors: [],
            warnings: []
        };

        var processWarning = function (warning, success) {
            var warningForDisplay = {};

            if (!_.isArray(warning.data)) {
                // create an array from warning.data so that correct warning message can be displayed
                // this can be removed if backend is updated to always return warning.data as an array
                var errorArray = [];
                errorArray.push(warning.data);

                warning.data = errorArray;
            }

            warningForDisplay.name = getProductByOrderId(JSON.stringify(warning.orderId));
            warningForDisplay.warningList = createWarningDisplayArr(warning);

            if (success) {
                vm.warningFromServer.warnings.push(warningForDisplay);
            } else {
                vm.warningFromServer.errors.push(warningForDisplay);
            }
            return warningForDisplay;
        };

        function createWarningDisplayArr(warning) {
            var props = ['code', 'message'];

            var warningFromServer = warningMsgs.filter(function (o1) {
                // filter out (!) items in result
                return warning.data.some(function (o2) {
                    return o1.code === o2.code;
                });
            }).map(function (o) {
                return props.reduce(function (newo, name) {
                    newo[name] = o[name];
                    return newo;
                }, {});
            });

            return warningFromServer;
        }

        //submitApplication will save changes, the workflow of placing order with cap will be triggered by postStateChange
        function continueToSubmit() {
            accountConfigurationService.submitApplication(dataModel, vm.model).then(function (submitResponse) {
                var responsePromises = [];
                _.forEach(submitResponse, function (order) {
                    responsePromises.push(accountConfigurationService.triggerPOStateChange(order.orderNumber));
                });
                return $q.all(responsePromises).then(function (results) {
                    // if the result is a success, note that it may contain multiple warnings in result.data
                    // if the result is an error, there will only be one object in result.data
                    var resultSplit = _.partition(results, function (result) {
                        return result.status.toString().match(/^2/);
                    });

                    var success = resultSplit[0];
                    var errors = resultSplit[1];

                    // Clear the errors from last submission because we only want to see errors for current submission
                    vm.warningFromServer.errors = [];
                    vm.warningFromServer.warnings = [];

                    if (errors.length) {
                        var errorMsgArray = [];

                        _.forEach(errors, function (error) {
                            var errorMsg = processWarning(error);
                            errorMsgArray.push(errorMsg);
                        });

                        parseErrors(errorMsgArray, success);
                    }
                    //If the PO state change returns successfully. We assue the state of PO order is finalized.
                    // Then we transition shopping card item state to complete. It takes three steps to be COMPLETE
                    if (success.length) {
                        var promises = [];
                        _.forEach(success, function (successfulOrder) {
                            // check if successfulOrder has any warnings
                            if (hasWarnings(successfulOrder)) {
                                processWarning(successfulOrder, true);
                            }
                            var order = _.find(dataModel.orders, {orderId: successfulOrder.orderId.toString()});
                            promises.push(shoppingCartService.finalizeItem(order.cartId, order.id));
                        });

                        $q.all(promises).then(function () {
                            //Update cart badge number
                            needsDataService.updateCartCount();
                        });
                        $state.go('bd.products.servicesetup');
                    }

                    //with current requirement we will not change state if there is some other error code
                    if (vm.warningFromServer.errors.length > 0 || vm.warningFromServer.warnings.length > 0) {
                        //ToDo card is raised to stop using dataStoreService and have some thing more safe.
                        dataStoreService.setError({errorsWarningsForDisplay: vm.warningFromServer});
                    }
                });
            })['finally'](function () {
                loadingSpinnerService.finish();
            });
        }

        function parseErrors(errors, success) {
            var error = {
                status: 500,
                data: {
                    displayMessage: 'At least one account has failed to open. Please complete set-up, then retry account opening via to-do list.',
                    errorsData: errors
                }
            };

            if (!success.length) {
                error.data.displayMessage = 'All accounts have failed to open. Please retry account opening.';
                vm.accountSubmitFailed = true;
            }
            $rootScope.$broadcast('errorModalOpened', error);
        }

        /**
         * Updates the data model containing the product application (CcdApplication in Origination Service)
         * Submit the product application to origination service.
         *
         */
        function submitProductApplication() {
            loadingSpinnerService.start();
            setViewValuetoDataModel();
            populateFeeAndCampaignToModel();
            shouldCardDeclarationBeDisplayed(continueToSubmit);
        }

        function getOrderCardInfoByProductId() {
            // check if product id has cards, else do not display Choose Your Card
            // set vm.orderCard to false if card order is not applicable
            vm.displayOrderCard = false;
            // At this moment we will use orderCard feature only from the first order in the sorted by priority list.
            var orderToCheck = _.sortBy(dataModel.orders, 'orderPriority')[0];
            var productId = orderToCheck.productBundles[0].productId;
            var product = productService.getProductById(productId);
            var orderCardInfoFeature = productService.getFeatureByFeatureType(product, 'orderCard');
            if (orderCardInfoFeature) {
                // display select card section
                vm.displayOrderCard = true;
                vm.model.orderCardInfo = JSON.parse(orderCardInfoFeature.value);
            }
        }

        function updateSelectedCard(selectedCardFromModal) {
            // this will update the selected card
            vm.model.cardSelected = selectedCardFromModal;
        }

        function showCardSelectModal() {
            removeSelection(vm.model.orderCardInfo);
            modal.selectCardModal('bd.products.configuration', {
                orderCardInfoList: vm.model.orderCardInfo
            }, vm.updateSelectedCard);
        }

        function getImage(image) {
            return utils.imageRequire(image);
        }

        function removeSelection(data) {
            _.each(data, function (item) {
                if (item.value === 'Visa Debit card' || item.value === 'ANZ Access card') {
                    item.selected = false;
                }
            });
        }

        function disableAddCard() {
            return !workflow.isKYCCompleted();
        }

        function removeCardSelection() {
            delete dataModel.cardSelected;
            delete vm.model.cardSelected;
        }
    }];
