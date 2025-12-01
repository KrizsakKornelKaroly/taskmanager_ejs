const express = require('express');
const router = express.Router();
const ejs = require('ejs');
const db = require('./db');
const moment = require('moment');

router.get('/', loginCheck, (req, res) => {

    db.query('SELECT * FROM tasks WHERE userId = ?', [req.session.user.id], (err, results) => {
        if (err) {
            console.log(err);
            req.session.error = "Hiba történt az adatbázis lekérdezés során!";
            req.session.severity = "danger";
            return res.redirect('/tasks');
        }

        openTasks = [];
        closedTasks = [];

        results.forEach(item => {
            item.start = moment(item.start).format('YYYY-MM-DD');
            item.end = moment(item.end).format('YYYY-MM-DD');
            if (item.status) {
                openTasks.push(item);
            } else {
                closedTasks.push(item);
            }
        });


        ejs.renderFile('views/tasks/tasks.ejs', { session: req.session, results, openTasks, closedTasks }, (err, html) => {
            if (err) {
                console.log(err);
                return
            }
            req.session.error = '';
            req.session.body = undefined;
            res.send(html);
        });
    });
});

//új feladat form
router.get('/new', loginCheck, (req, res) => {

    ejs.renderFile('views/tasks/tasks-new.ejs', { session: req.session }, (err, html) => {
        if (err) {
            console.log(err);
            return
        }
        req.session.error = '';
        req.session.body = undefined;
        res.send(html);
    });
});

//új feladat mentés
router.post('/new', loginCheck, (req, res) => {
    let { title, description, start, end } = req.body;
    let now = moment().format('YYYY-MM-DD');

    req.session.body = req.body;

    if (title == "" || start == "" || end == "") {
        req.session.error = "Minden mező kitöltése kötelező!";
        req.session.severity = "danger";
        return res.redirect('/tasks/new');
    }

    if (moment(start).isAfter(moment(end))) {
        req.session.error = "A kezdő dátum nem lehet későbbi, mint a befejezés dátuma!";
        req.session.severity = "danger";
        return res.redirect('/tasks/new');
    }

    if (moment(start).isBefore(moment(now))) {
        req.session.error = "A kezdés dátuma nem lehet a múltban!";
        req.session.severity = "danger";
        return res.redirect('/tasks/new');
    }

    db.query('INSERT INTO tasks (userId, title, description, start, end, status) VALUES (?, ?, ?, ?, ?, ?)',
        [req.session.user.id, title, description, start, end, '1'], (err, results) => {
            if (err) {
                console.log(err);
                req.session.error = "Hiba történt az adatbázis művelet során!";
                req.session.severity = "danger";
                return res.redirect('/tasks/new');
            }

            req.session.error = "A feladat sikeresen létrehozva!";
            req.session.severity = "success";
            res.redirect('/tasks');
        });
});




//feladat módosítása form
router.get('/edit/:id', loginCheck, (req, res) => {
    let id = req.params.id;

    db.query('SELECT * FROM tasks WHERE id = ? AND userId = ?', [id, req.session.user.id], (err, results) => {
        if (err) {
            console.log(err);
            req.session.error = "Hiba történt az adatbázis lekérdezés során!";
            req.session.severity = "danger";
            return res.redirect('/tasks');
        }

        results[0].start = moment(results[0].start).format('YYYY-MM-DD');
        results[0].end = moment(results[0].end).format('YYYY-MM-DD');

        ejs.renderFile('views/tasks/tasks-edit.ejs', { session: req.session, task: results[0] }, (err, html) => {
            if (err) {
                console.log(err);
                return
            }
            req.session.error = '';
            req.session.body = undefined;
            res.send(html);
        });
    });

});

//feladat módosítása mentés
router.post('/edit/:id', loginCheck, (req, res) => {
    let id = req.params.id;
    let { title, description, start, end } = req.body;
    let now = moment().format('YYYY-MM-DD');
    req.session.body = req.body;

    if (title == "" || start == "" || end == "") {
        req.session.error = "Minden mező kitöltése kötelező!";
        req.session.severity = "danger";
        return res.redirect('/tasks/edit/' + id);
    }

    if (moment(start).isAfter(moment(end))) {
        req.session.error = "A kezdő dátum nem lehet későbbi, mint a befejezés dátuma!";
        req.session.severity = "danger";
        return res.redirect('/tasks/edit/' + id);
    }

    if (moment(start).isBefore(moment(now))) {
        req.session.error = "A kezdés dátuma nem lehet a múltban!";
        req.session.severity = "danger";
        return res.redirect('/tasks/edit/' + id);
    }

    db.query('UPDATE tasks SET title = ?, description = ?, start = ?, end = ? WHERE id = ?',
        [title, description, start, end, id], (err, results) => {
            if (err) {
                console.log(err);
                req.session.error = "Hiba történt az adatbázis művelet során!";
                req.session.severity = "danger";
                return res.redirect('/tasks/edit/' + id);
            }
            req.session.error = "A feladat sikeresen módosítva!";
            req.session.severity = "success";
            res.redirect('/tasks');
        });
});




//feladat késznek jelölése form
router.get('/ready/:id', loginCheck, (req, res) => {
    let id = req.params.id;

    db.query('SELECT * FROM tasks WHERE id = ? AND userId = ?', [id, req.session.user.id], (err, results) => {
        if (err) {
            console.log(err);
            req.session.error = "Hiba történt az adatbázis lekérdezés során!";
            req.session.severity = "danger";
            return res.redirect('/tasks');
        }
        results[0].start = moment(results[0].start).format('YYYY-MM-DD');
        results[0].end = moment(results[0].end).format('YYYY-MM-DD');
        ejs.renderFile('views/tasks/tasks-ready.ejs', { session: req.session, task: results[0] }, (err, html) => {
            if (err) {
                console.log(err);
                return
            }
            req.session.error = '';
            req.session.body = undefined;
            res.send(html);
        });
    });
});

//feladat késznek jelölése mentés
router.post('/ready/:id', loginCheck, (req, res) => {
    let id = req.params.id;

    db.query('UPDATE tasks SET status = not status WHERE id = ?',
        [id], (err, results) => {
            if (err) {
                console.log(err);
                req.session.error = "Hiba történt az adatbázis művelet során!";
                req.session.severity = "danger";
                return res.redirect('/tasks/ready/' + id);
            }
            req.session.error = "A feladat státusza sikeresen módosítva!";
            req.session.severity = "success";
            res.redirect('/tasks');
        });
});




//feladat törlése
router.get('/delete/:id', loginCheck, (req, res) => {
    let id = req.params.id;

    db.query('SELECT * FROM tasks WHERE id = ? AND userId = ?', [id, req.session.user.id], (err, results) => {
        if (err) {
            console.log(err);
            req.session.error = "Hiba történt az adatbázis lekérdezés során!";
            req.session.severity = "danger";
            return res.redirect('/tasks');
        }
        results[0].start = moment(results[0].start).format('YYYY-MM-DD');
        results[0].end = moment(results[0].end).format('YYYY-MM-DD');
        ejs.renderFile('views/tasks/tasks-delete.ejs', { session: req.session, task: results[0] }, (err, html) => {
            if (err) {
                console.log(err);
                return
            }
            req.session.error = '';
            req.session.body = undefined;
            res.send(html);
        });
    });
});

//feladat törlése ment.
router.post('/delete/:id', loginCheck, (req, res) => {
    let id = req.params.id;

    db.query('DELETE FROM tasks WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.log(err);
            req.session.error = "Hiba történt az adatbázis művelet során!";
            req.session.severity = "danger";
            return res.redirect('/tasks/delete/' + id);
        }
        req.session.error = "A feladat sikeresen törölve!";
        req.session.severity = "success";
        res.redirect('/tasks');
    });
 });


router.get('/calendar', loginCheck, (req, res) => {
    let calEvents = [];

    db.query('SELECT * FROM tasks WHERE userId = ?', [req.session.user.id], (err, results) => {
        if (err) {
            console.log(err);
            req.session.error = "Hiba történt az adatbázis lekérdezés során!";
            req.session.severity = "danger";
            return res.redirect('/tasks');
        }

        results.forEach(item => {
            calEvents.push({
                title: item.title,
                start: moment(item.start).format('YYYY-MM-DD'),
                end: moment(item.end).format('YYYY-MM-DD'),
                backgroundColor: item.status ? '#198754' : '#ffc107',
                borderColor: item.status ? '#198754' : '#ffc107',
                textColor: item.status ? '#ffffff' : '#000000',
            });
        });

        ejs.renderFile('views/tasks/calendar.ejs', { session: req.session, calEvents }, (err, html) => {
            if (err) {
                console.log(err);
                return
            }
            req.session.error = '';
            req.session.body = undefined;
            res.send(html);
        });

    });

});

router.get('/statistics', loginCheck, (req, res) => {
    db.query('SELECT * FROM statistics WHERE uId = ?', [req.session.user.id], (err, results) => {
        if (err) {
            console.log(err);
            req.session.error = "Hiba történt az adatbázis lekérdezés során!";
            req.session.severity = "danger";
            return res.redirect('/tasks');
        }
        ejs.renderFile('views/tasks/statistics.ejs', { session: req.session, data: results[0]}, (err, html) => {
            if (err) {
                console.log(err);
                return
            }
            req.session.error = '';
            req.session.body = undefined;
            res.send(html);
        });
    });

});


function loginCheck(req, res, next) {
    if (req.session.user) {
        return next();
    }
    return res.redirect('/users/login');
}

module.exports = router;