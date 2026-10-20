/*global QUnit*/
import opaTest from "sap/ui/test/opaQunit";
import AppPage from "./pages/AppPage";
import ViewPage from "./pages/DrivePage";

import Opa5 from "sap/ui/test/Opa5";

QUnit.module("Navigation Journey");

const onTheAppPage = new AppPage();
const onTheViewPage = new ViewPage();
Opa5.extendConfig({
	viewNamespace: "poc.cpi.ral.drivefilemanager.view.",
	autoWait: true
});

opaTest("Should see the initial page of the app", function () {
	// Arrangements
	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	onTheAppPage.iStartMyUIComponent({
		componentConfig: {
			name: "poc.cpi.ral.drivefilemanager"
		}
	});

	// Assertions
	onTheAppPage.iShouldSeeTheApp();
	onTheViewPage.iShouldSeeThePageView();


	// Cleanup
	// eslint-disable-next-line @typescript-eslint/no-floating-promises
	onTheAppPage.iTeardownMyApp();
});