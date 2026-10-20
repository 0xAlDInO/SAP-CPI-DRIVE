/*global QUnit*/
import Controller from "poc/cpi/ral/drivefilemanager/controller/Drive.controller";

QUnit.module("Drive Controller");

QUnit.test("I should test the Drive controller", function (assert: Assert) {
	const oAppController = new Controller("Drive");
	oAppController.onInit();
	assert.ok(oAppController);
});