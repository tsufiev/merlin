
 /*    Copyright (c) 2014 Mirantis, Inc.

    Licensed under the Apache License, Version 2.0 (the "License"); you may
    not use this file except in compliance with the License. You may obtain
    a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
    License for the specific language governing permissions and limitations
    under the License.
*/
describe('workbook model logic', function() {
  var models, utils, workbook;

  beforeEach(function() {
    module('mistral');
    inject(function($injector) {
      models = $injector.get('mistral.workbook.models');
      utils = $injector.get('merlin.utils');
    });
    workbook = models.Workbook.create();
  });

  function getWorkflow(workflowID) {
    // once workflow is recreated with JSON, old instance is no longer
    // valid, thus we need to get it this way
    return workbook.get('workflows').getByID(workflowID);
  }

  describe('defines workflow structure transformations:', function() {
    var workflowID = 'workflow1';

    beforeEach(function() {
      workbook.get('workflows').push({name: 'Workflow 1'}, {id: workflowID});
    });

    it("new workflow starts as a 'direct' workflow and has proper structure", function() {
      var workflow = getWorkflow(workflowID);

      expect(workflow.get('type').get()).toEqual('direct');
      expect(workflow.instanceof(models.DirectWorkflow)).toBe(true);
    });

    it("after setting type to 'reverse' the workflow structure changes to the proper one", function() {
      getWorkflow(workflowID).get('type').set('reverse');

      expect(getWorkflow(workflowID).instanceof(models.ReverseWorkflow)).toBe(true);
    });

    it("changing 'reverse' type to 'direct' again causes workflow structure to properly change", function() {
      getWorkflow(workflowID).get('type').set('reverse');
      getWorkflow(workflowID).get('type').set('direct');

      expect(getWorkflow(workflowID).instanceof(models.DirectWorkflow)).toBe(true);
    });

  });

  describe('defines task structure transformations', function() {
    var workflowID = 'workflow1',
      taskID = 'task1';

    function getTask(taskID) {
      // once task is recreated with JSON, old instance is no longer
      // valid, thus we need to get it this way
      return getWorkflow(workflowID).get('tasks').getByID(taskID);
    }

    beforeEach(function() {
      workbook.get('workflows').push({name: 'Workflow 1'}, {id: workflowID});
    });

    describe('', function() {
      beforeEach(function() {
        var workflow = getWorkflow(workflowID),
          params = workflow._parameters;
        workflow.get('tasks').push({name: 'Task 1'}, utils.extend(params, {id: taskID}));
      });

      it("corresponding JSON has the right key for the Task", function() {
        var json = workbook.toJSON({pretty: true});

        expect(json.workflows[workflowID].tasks[taskID]).toBeDefined();
      });

      it("once the task ID is changed, it's reflected in JSON", function() {
        var newID = 'task10',
          json;

        getTask(taskID).setID(newID);
        json = workbook.toJSON({pretty: true});

        expect(json.workflows[workflowID].tasks[taskID]).toBeUndefined();
        expect(json.workflows[workflowID].tasks[newID]).toBeDefined();
      });

      it('a task deletion works in conjunction with tasks logic', function() {
        expect(getTask(taskID)).toBeDefined();

        getTask(taskID).remove();
        expect(getTask(taskID)).toBeUndefined();
      });

    });

    describe("which start with the 'direct' workflow:", function() {
      beforeEach(function() {
        var workflow = getWorkflow(workflowID),
          params = workflow._parameters;
        workflow.get('tasks').push({name: 'Task 1'}, utils.extend(params, {id: taskID}));
      });

      it("new task starts as an 'action'-based one and has proper structure", function() {
        expect(getTask(taskID).get('type').get()).toEqual('action');
        expect(getTask(taskID).instanceof(models.ActionTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.DirectWFTask)).toBe(true);
      });

      it("changing task type from 'action' to 'workflow' causes proper structure changes", function() {
        getTask(taskID).get('type').set('workflow');

        expect(getTask(taskID).instanceof(models.WorkflowTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.DirectWFTask)).toBe(true);
      });

      it("changing workflow type to 'reverse' causes the proper changes to its tasks", function() {
        getWorkflow(workflowID).get('type').set('reverse');

        expect(getTask(taskID).instanceof(models.ActionTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.ReverseWFTask)).toBe(true);

        getTask(taskID).get('type').set('workflow');

        expect(getTask(taskID).instanceof(models.WorkflowTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.ReverseWFTask)).toBe(true);
      });

      it("changing workflow type from 'reverse' to 'direct' causes the proper changes to its tasks", function() {
        getWorkflow(workflowID).get('type').set('reverse');
        getWorkflow(workflowID).get('type').set('direct');

        expect(getTask(taskID).instanceof(models.ActionTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.DirectWFTask)).toBe(true);

        getTask(taskID).get('type').set('workflow');

        expect(getTask(taskID).instanceof(models.WorkflowTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.DirectWFTask)).toBe(true);
      });
    });

    describe("which start with the 'reverse' workflow:", function() {
      beforeEach(function() {
        var workflow;
        getWorkflow(workflowID).get('type').set('reverse');
        workflow = getWorkflow(workflowID);
        workflow.get('tasks').push(
          {name: 'Task 1'}, utils.extend(workflow._parameters, {id: taskID}));
      });

      it("new task starts as an 'action'-based one and has proper structure", function() {
        expect(getTask(taskID).get('type').get()).toEqual('action');
        expect(getTask(taskID).instanceof(models.ActionTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.ReverseWFTask)).toBe(true);
      });

      it("changing task type from 'action' to 'workflow' causes proper structure changes", function() {
        getTask(taskID).get('type').set('workflow');

        expect(getTask(taskID).instanceof(models.WorkflowTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.ReverseWFTask)).toBe(true);
      });

      it("changing workflow type to 'direct' causes the proper changes to its tasks", function() {
        getWorkflow(workflowID).get('type').set('direct');

        expect(getTask(taskID).instanceof(models.ActionTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.DirectWFTask)).toBe(true);

        getTask(taskID).get('type').set('workflow');

        expect(getTask(taskID).instanceof(models.WorkflowTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.DirectWFTask)).toBe(true);
      });

      it("changing workflow type from 'direct' to 'reverse' causes the proper changes to its tasks", function() {
        getWorkflow(workflowID).get('type').set('direct');
        getWorkflow(workflowID).get('type').set('reverse');

        expect(getTask(taskID).instanceof(models.ActionTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.ReverseWFTask)).toBe(true);

        getTask(taskID).get('type').set('workflow');

        expect(getTask(taskID).instanceof(models.WorkflowTaskMixin)).toBe(true);
        expect(getTask(taskID).instanceof(models.ReverseWFTask)).toBe(true);
      });
    });
  });

  describe('defines top-level actions available to user:', function() {
    var $scope;

    beforeEach(inject(function(_$controller_) {
      var $controller = _$controller_;
      $scope = {};
      $controller('workbookCtrl', {$scope: $scope});
      $scope.workbook = workbook;
    }));

    describe("'Add Action' action", function() {
      it('adds a new Action', function() {
        $scope.addAction();

        expect(workbook.get('actions').get(0)).toBeDefined();
      });

      it('creates action with predefined name', function() {
        $scope.addAction();

        expect(workbook.get('actions').get(0).getID()).toBeGreaterThan('');
      });

      describe('', function() {
        var actionID;
        beforeEach(inject(function(baseActionID) {
          actionID = baseActionID + '1';
        }));

        it("corresponding JSON has the right key for the Action", function() {
          $scope.addAction();

          expect(workbook.toJSON({pretty: true}).actions[actionID]).toBeDefined();
        });

        it("once the Action ID is changed, it's reflected in JSON", function() {
          var newID = 'action10';

          $scope.addAction();
          workbook.get('actions').getByID(actionID).setID(newID);

          expect(workbook.toJSON({pretty: true}).actions[actionID]).toBeUndefined();
          expect(workbook.toJSON({pretty: true}).actions[newID]).toBeDefined();
        });

      });

      it('creates actions with different names on 2 successive calls', function() {
        $scope.addAction();
        $scope.addAction();

        expect(workbook.get('actions').get(0).getID()).not.toEqual(
          workbook.get('actions').get(1).getID())
      });
    });

    describe("'Add Workflow' action", function() {
      it('adds a new Workflow', function() {
        $scope.addWorkflow();

        expect(workbook.get('workflows').get(0)).toBeDefined();
      });

      describe('', function() {
        var workflowID;
        beforeEach(inject(function(baseWorkflowID) {
          workflowID = baseWorkflowID + '1';
        }));

        it("corresponding JSON has the right key for the Workflow", function() {
          $scope.addWorkflow();

          expect(workbook.toJSON({pretty: true}).workflows[workflowID]).toBeDefined();
        });

        it("once the workflow ID is changed, it's reflected in JSON", function() {
          var newID = 'workflow10';

          $scope.addWorkflow();
          workbook.get('workflows').getByID(workflowID).setID(newID);

          expect(workbook.toJSON({pretty: true}).workflows[workflowID]).toBeUndefined();
          expect(workbook.toJSON({pretty: true}).workflows[newID]).toBeDefined();
        });

      });

      it('creates workflow with predefined name', function() {
        $scope.addWorkflow();

        expect(workbook.get('workflows').get(0).getID()).toBeGreaterThan('');
      });

      it('creates workflows with different names on 2 successive calls', function() {
        $scope.addWorkflow();
        $scope.addWorkflow();

        expect(workbook.get('workflows').get(0).getID()).not.toEqual(
          workbook.get('workflows').get(1).getID())
      });

    });

    describe("'Create'/'Modify'/'Cancel' actions", function() {
      it('edit causes a request to an api and a return to main page', function() {

      });

      it('cancel causes just a return to main page', function() {

      });
    });

  })
});
