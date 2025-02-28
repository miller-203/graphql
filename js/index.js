const body = document.querySelector('.body')
if (localStorage.getItem('jwt')) {
    Profile(localStorage.getItem('jwt'));
} else {
    createloginSection();
}

function createloginSection() {
    const container = document.createElement('div');
    container.classList.add('login-container');
    container.className = "login-container"
    container.innerHTML = `
        <div class="login-form">
            <h2>Login</h2>
            <div class="input-group">
                <label for="username"> <i class="login-icon fas fa-user" style="color: #5c9dfc;"></i> Username</label>
                <input type="text" id="username" name="username" placeholder="Enter your username or email" required>
            </div>
            <div class="input-group">
                <label for="password"><i class="login-icon fas fa-lock" style="color: #5c9dfc;"></i> Password</label>
                <input type="password" id="password" name="password" placeholder="Enter your password" required>
            </div>
            <small class="error"></small>
            <button type="submit" class="login-btn">Login</button>
        </div>
    `
    body.appendChild(container);
}

const login = document.querySelector('.login-btn');
const container = document.querySelector('.login-container');
const errorMsg = document.querySelector('.error');

login?.addEventListener('click', async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const userPassword = document.getElementById('password').value;

    try {
        const response = await fetch('https://learn.zone01oujda.ma/api/auth/signin', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${btoa(`${username}:${userPassword}`)}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const data = await response.json();
            container.remove();
            localStorage.setItem('jwt', data);
            Profile(data);
        } else if (response.status === 401) {
            errorMsg.textContent = "You do not have permission to access this resource.";
            setTimeout(() => {
                errorMsg.textContent = "";
            }, 1000);
        } else {
            errorMsg.textContent = "Invalid password.";
            setTimeout(() => {
                errorMsg.textContent = "";
            }, 1000);
        }
    }
    catch {
        alert("An error occurred. Please try again later.")
    }
});

async function Profile(data) {
    try {
        const response = await fetch('https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${data}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: `
                query {
                    user{
                            login
                            firstName
                            lastName
                            auditRatio
                            totalDown
                            totalUp
                            totalUpBonus
                            skills: transactions(
                                    where: {
                                        type: { _like: "skill_%" } 
                                            }
                              order_by: { amount: desc }
                                ) {
                            amount
                            type
                        }

                        transactions (where :{_and : [
                        {type : {_eq :"level"}}
                        {object :{type :{_eq :"project"}}}
                        ]}
                        limit : 1
                        order_by : {amount :desc}
                        ){
                            amount
                        }

                        totalXp: transactions_aggregate(
                            where: {
                            _and: [
                            { type: { _eq: "xp" } }
                            {event:{object:{name:{_eq:"Module"}}}}
                        ]
                        }
                        ) {
                        aggregate {
                        sum {
                            amount
                            }
                        }
                        } 
                        }
                        
                        transaction (where:{_and:[
                            {type :{_eq :"xp"}}
                            {event:{object:{name:{_eq:"Module"}}}}
                        ]}
                            order_by :{createdAt :asc}
                        ){
                            amount
                            object{
                                name
                            }
                            createdAt
                        }
                    }
                `,
            }),
        });
        if (response.ok) {
            const userData = await response.json();

            if (userData.data.transaction.length === 0) {
                displayUserSpecial(userData);
                return;
            }

            displayProfile(userData);
            const newData = takeAbigValue(userData);

            const skills = {
                "Go": newData.find(skill => skill.type === 'skill_go')?.amount || 0,
                "Prog": newData.find(skill => skill.type === 'skill_prog')?.amount || 0,
                "Back-End": newData.find(skill => skill.type === 'skill_back-end')?.amount || 0,
                "Front-End": newData.find(skill => skill.type === 'skill_front-end')?.amount || 0,
                "Unix": newData.find(skill => skill.type === 'skill_unix')?.amount || 0,
                "Js": newData.find(skill => skill.type === 'skill_js')?.amount || 0,
                "Algo": newData.find(skill => skill.type === 'skill_algo')?.amount || 0,
                "TCP/IP": newData.find(skill => skill.type === 'skill_tcp')?.amount || 0
            };

            updateGraph(skills);
            updateGraphXp(userData.data.transaction);
        } else {
            alert("An error occurred. Please try again later.")
        }
    }
    catch {
        logoutSection();
    }
}

function takeAbigValue(data) {
    const newSkills = [];
    const skills = data.data.user[0].skills;

    const skillMap = {};

    for (let i = 0; i < skills.length; i++) {
        const { type, amount } = skills[i];        
        
        if (!skillMap[type] || skillMap[type].amount < amount) {
            skillMap[type] = skills[i];
        }
    }

    for (const type in skillMap) {
        newSkills.push(skillMap[type]);
    }

    return newSkills;
}


function formatSize(value) {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)} <span style="color: #fdefef; font-size: 3rem;">MB</span>`;
    } else if (value >= 1000) {
        return `${parseInt(value / 1000)} <span style="color: #fdefef; font-size: 3rem;">KB</span>`;
    } else {
        return `${parseInt(value)} <span style="color: #fdefef; font-size: 3rem;">B</span>`;
    }
}

function checkrank(level) {
    if (level >= 0 && level <= 10) {
        return `${"Aspiring developer"}`;
    } else if (level >= 11 && level <= 20) {
        return `${"Beginner developer"}`;
    } else if (level >= 21 && level <= 30) {
        return `${"Apprentice developer"}`;
    } else if (level >= 31 && level <= 40) {
        return `${"Assistant developer"}`;
    } else if (level >= 41 && level <= 50) {
        return `${"Basic developer"}`;
    } else if (level >= 51 && level <= 55) {
        return `${"Junior developer"}`;
    } else if (level >= 56 && level <= 60) {
        return `${"Full-Stack developer"}`;
    }
}

function displayUserSpecial(userData) {
    const ProfileSpecial = document.createElement('div');
    ProfileSpecial.className = "ProfileSpecial";
    ProfileSpecial.innerHTML = `
    <header>
        <h1>Welcome, ${userData.data.user[0].firstName} ${userData.data.user[0].lastName}!</h1>
        <button class="logout-btn" onclick="logoutSection()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 17L21 12L16 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 12H9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
                Logout
        </button>
    </header>
    <p style="color: #fdf0f0ee; text-align: center; margin-top: 150px;">No data available.</p>
    `
    body.appendChild(ProfileSpecial);
}

function displayProfile(userData) {
    const Profile = document.createElement('div');
    Profile.className = "profile";
    Profile.innerHTML = `
        <header>
            <h1>Welcome, ${userData.data.user[0].firstName} ${userData.data.user[0].lastName}!</h1>
            <button class="logout-btn" onclick="logoutSection()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 17L21 12L16 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12H9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                    Logout
            </button>
        </header>
        <main>
            <section class="level-info">
                <div class="rank">
                    <h6>Current rank</h6>
                    <h5>${checkrank(userData.data.user[0].transactions[0].amount)}</h5>
                </div>
                <div class="level-info__item">
                    <h2>Level</h2>
                    <p>${userData.data.user[0].transactions[0].amount}</p>
                </div>
            </section>
            <section class="info">
                <div class="resume-info">
                    <h1 class="paragraphe">What's up</h1>
                    <div style="display: flex; align-items: center; gap: 2%; margin: 3% 0;">
                        <svg width="40" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="#9B5DE5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <h4>Resume</h4>
                        <h3>${userData.data.transaction[userData.data.transaction.length - 1].object.name}</h3>
                    </div>
                </div>
                <div class="xp-info">
                    <h1 class="xp"> ${formatSize(userData.data.user[0].totalXp.aggregate.sum.amount)}</h1>
                </div>
            </section>
            <section class="Audit-info">
                <h2>Audits ratio</h2>
                <div class="audit-section">
                    <span>Done</span>
                    <span> <b>${(userData.data.user[0].totalUp / 1000000).toFixed(2)} MB</b> <small style="color: #FFC107;">+ ${(userData.data.user[0].totalUpBonus / 1000).toFixed(2)} kB ↑</small> </span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="--progress: 100%;"></div>
                </div>

                <div class="audit-section">
                    <span>Received</span>
                    <span> <b>${(userData.data.user[0].totalDown / 1000000).toFixed(2)} MB</b> <small style="color: #BBB;">↓</small> </span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="--progress: 100%; background-color: white;"></div>
                </div>

                <div class="audit-ratio">
                    ${(userData.data.user[0].auditRatio).toFixed(1)}
                </div>
            </section>
        </main>
        <main>
            <section class="Skills-info">
                <h1>Best Skills</h1>
                <svg width="350" height="350" viewBox="0 0 400 400">
                    <g transform="translate(200,200)">
                        <circle cx="0" cy="0" r="20" stroke="#888" fill="none"/>
                        <circle cx="0" cy="0" r="40" stroke="#888" fill="none"/>
                        <circle cx="0" cy="0" r="60" stroke="#888" fill="none"/>
                        <circle cx="0" cy="0" r="80" stroke="#888" fill="none"/>
                        <circle cx="0" cy="0" r="100" stroke="#888" fill="none"/>
                        <circle cx="0" cy="0" r="120" stroke="#888" fill="none"/>
                        <circle cx="0" cy="0" r="140" stroke="#888" fill="none"/>
                        <circle cx="0" cy="0" r="160" stroke="#888" fill="none"/>
                        <circle cx="0" cy="0" r="180" stroke="#888" fill="none"/>
                        <circle cx="0" cy="0" r="200" stroke="#888" fill="none"/>

                        <line x1="0" y1="-180" x2="0" y2="180" stroke="#888"/>
                        <line x1="-127.28" y1="-127.28" x2="127.28" y2="127.28" stroke="#888"/>
                        <line x1="-180" y1="0" x2="180" y2="0" stroke="#888"/>
                        <line x1="-127.28" y1="127.28" x2="127.28" y2="-127.28" stroke="#888"/>
                        <line x1="0" y1="180" x2="0" y2="-180" stroke="#888"/>
                        <line x1="127.28" y1="127.28" x2="-127.28" y2="-127.28" stroke="#888"/>
                        <line x1="180" y1="0" x2="-180" y2="0" stroke="#888"/>
                        <line x1="127.28" y1="-127.28" x2="-127.28" y2="127.28" stroke="#888"/>
                        
                        <text x="0" y="-185" fill="white" text-anchor="middle">Go</text>
                        <text x="130" y="-130" fill="white" text-anchor="middle">Prog</text>
                        <text x="165" y="0" fill="white" text-anchor="middle">Back-End</text>
                        <text x="135" y="135" fill="white" text-anchor="middle">Front-End</text>
                        <text x="0" y="195" fill="white" text-anchor="middle">Unix</text>
                        <text x="-135" y="135" fill="white" text-anchor="middle">Js</text>
                        <text x="-185" y="0" fill="white" text-anchor="middle">Algo</text>
                        <text x="-135" y="-135" fill="white" text-anchor="middle">TCP/IP</text>
                        
                        <polygon id="skillPolygon" fill="rgba(210, 139, 231, 0.5)" stroke="#ADD8E6" stroke-width="2"/>
                    </g>
                </svg>
            </section>
            <section id="project_info" class="project-info">
                <div id="result">
                </div>
                <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg" id="svg">
                    <line x1="0" y1="400" x2="600" y2="400" stroke="black" />
                    <line x1="0" y1="20" x2="0" y2="400" stroke="black" />

                    <path id="path" d="" stroke="blue" fill="none" />
                </svg>
            </section>
        </main>
                        `
    body.appendChild(Profile);
}

const logout = document.querySelector('.logout-btn');
function logoutSection() {
    localStorage.removeItem('jwt');
    window.location.href = '/';
}

function updateGraph(data) {
    const angles = [0, 45, 90, 135, 180, 225, 270, 315];
    const maxValue = 100;
    const scale = 200 / maxValue;

    let points = angles.map((angle, j) => {
        let skillName = Object.keys(data)[j];
        let value = data[skillName] || 0;
        let radian = (angle - 90) * (Math.PI / 180);
        let x = Math.cos(radian) * value * scale;
        let y = Math.sin(radian) * value * scale;
        return `${x},${y}`;
    }).join(" ");

    document.getElementById("skillPolygon").setAttribute("points", points);
}

function updateGraphXp(datas) {
    // console.log(datas);
    let cumulativeXP = 0;
    const width = 600;
    const height = 400;

    const dataPoints = datas.map((data) => {

        cumulativeXP += data.amount;
        return {
            date: new Date(data.createdAt),
            name: data.object.name,
            xp: cumulativeXP,
        };
    });

    
    if (dataPoints.length === 0) return;

    const endTime = dataPoints[dataPoints.length - 1].date;
    const startTime = dataPoints[0].date;
    const maxXP = dataPoints[dataPoints.length - 1].xp;    

    const pathData = dataPoints.map((point, index) => {
        const x = scaleX(point.date, endTime, startTime, width);
        const y = scaleY(point.xp, maxXP, height);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");

    const border = document.getElementById("result")
    const svg = document.getElementById("svg");
    const path = document.getElementById("path")
    path.setAttribute("d", pathData);

    dataPoints.forEach((point) => {
        const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
        );
        const x = scaleX(point.date, endTime, startTime, width);
        const y = scaleY(point.xp, maxXP, height);

        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", "5");
        circle.setAttribute("fill", "#bb7eec");
        circle.addEventListener("mouseenter", (e) => {
            const div = document.createElement("div");
            div.innerHTML = `
                Name : ${point.name}<br>
                Total XP : ${formatSize(point.xp)}
            `;

            div.style.left = "10px";
            div.style.top = "10px";
            div.style.backgroundColor = "#fdf0f0ee";
            div.style.zIndex = "1000";

            circle.setAttribute("r", "8");
            circle.addEventListener("mouseleave", () => {
                div.remove();
                circle.setAttribute("r", "5");
            });
            border.append(div);
        });
        svg.append(circle);
    });
}

function scaleX(date, endDate, startDate, width) {
    const timeRange = endDate - startDate;
    const timePosition = date - startDate;
    return (timePosition / timeRange) * width;
}

function scaleY(xp, maxXP, height) {
    return height - (xp / maxXP) * height;
}