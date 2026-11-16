import { Router } from "express";
import {
    createTask,
    getTasksByRunId,
    getTaskById, updateTask, deleteTask,
} from "../repositories/tasks.repository.js";
import {
    validateCreateTask,
    validateRunId, validateUpdateTask,
    validateUUID,
} from "../validators/tasks.validation.js";

export const tasksRouter = Router();

tasksRouter.post("/", async (req, res) => {
    const error = validateCreateTask(req.body);

    if (error) {
        return res.status(400).send({error});
    }

    try {
        const task = await createTask({
            title: req.body.title,
            runId: req.body.runId,
            ownerLogin: process.env.MOODLE_LOGIN,
        });

        return res.status(201).json(task);
    } catch (error) {
        process.stderr.write(`Database error [${error.code ?? 'unknown'}]: ${error.message}\n`);

        return res.status(503).json({
            error: 'Database unavailable'
        });
    }
});

tasksRouter.get("/", async (req, res) => {
    const { runId } = req.query;

    if (!validateRunId(runId)) {
        return res.status(400).json({
            error: "Invalid runId",
        });
    }

    try {
        const tasks = await getTasksByRunId(
            process.env.MOODLE_LOGIN,
            runId
        );

        return res.status(200).json(tasks);
    } catch (error) {
        process.stderr.write(`Database error: ${error.message}\n`);

        return res.status(503).json({
            error: 'Database unavailable'
        });
    }
});

tasksRouter.get("/:id", async (req, res) => {
    const { id } = req.params;

    if (!validateUUID(id)) {
        return res.status(400).json({
            error: "Invalid UUID",
        });
    }

    try {
        const task = await getTaskById(
            process.env.MOODLE_LOGIN,
            id
        );

        if (!task) {
            return res.status(404).json({
                error: 'Task not found',
            });
        }

        return res.status(200).json(task);
    } catch (error) {
        process.stderr.write(`Database error: ${error.message}\n`);

        return res.status(503).json({
            error: 'Database unavailable'
        });
    }
});

tasksRouter.patch("/:id", async (req, res) => {
    const { id } = req.params;

    if (!validateUUID(id)) {
        return res.status(400).json({
            error: "Invalid UUID",
        });
    }

    const error = validateUpdateTask(req.body);

    if (error) {
        return res.status(400).json({ error });
    }

    try {
        const task = await updateTask(
            process.env.MOODLE_LOGIN,
            id,
            req.body
        );

        if (!task) {
            return res.status(404).json({
                error: 'Task not found',
            });
        }

        return res.status(200).json(task);
    } catch (error) {
        process.stderr.write(`Database error: ${error.message}\n`);

        return res.status(503).json({
            error: 'Database unavailable'
        });
    }
});

tasksRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;

    if (!validateUUID(id)) {
        return res.status(400).json({
            error: "Invalid UUID",
        });
    }

    try {
        const deleted = await deleteTask(
            process.env.MOODLE_LOGIN,
            id
        );

        if (!deleted) {
            return res.status(404).json({
                error: 'Task not found',
            });
        }

        return res.status(204).end();
    } catch (error) {
        process.stderr.write(`Database error: ${error.message}\n`);

        return res.status(503).json({
            error: 'Database unavailable'
        })
    }
})