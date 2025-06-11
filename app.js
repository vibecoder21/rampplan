// GenAI Project Ramp Planning - JavaScript Application
class RampPlanningApp {
    constructor() {
        this.charts = {};
        this.config = this.getDefaultConfig();
        this.init();
    }

    getDefaultConfig() {
        return {
            projectName: "Sample GenAI Project",
            targetTasks: 10000,
            targetPeriodWeeks: 2,
            l1AHT: 0.5,
            l0AHT: 0.32,
            sbqRate: 15,
            dailyHours: 5,
            wtAttempters: 100,
            wtReviewers: 50,
            activationRate: 80,
            screeningRate: 60,
            rampPattern: "Linear",
            weekendBoost: 20,
            totalMissions: 3,
            productivityBoost: 20,
            webinarDuration: 30,
            cost30min: 25,
            cost60min: 45
        };
    }

    init() {
        this.bindEvents();
        this.setupTabs();
        this.setupCollapsibleSections();
        this.calculateMetrics();
        this.initializeCharts();
        this.updateUI();
    }

    bindEvents() {
        // Form inputs
        const inputs = [
            'projectName', 'targetTasks', 'targetPeriodWeeks', 'l1AHT', 'l0AHT', 
            'dailyHours', 'wtAttempters', 'wtReviewers', 'totalMissions', 
            'cost30min', 'cost60min'
        ];
        
        inputs.forEach(id => {
            const element = document.getElementById(id === 'targetPeriodWeeks' ? 'targetPeriod' : id);
            if (element) {
                element.addEventListener('input', () => this.handleInputChange(id, element.value));
            }
        });

        // Sliders
        const sliders = ['sbqRate', 'activationRate', 'screeningRate'];
        sliders.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    this.handleInputChange(id, element.value);
                    this.updateSliderValue(id, element.value);
                });
            }
        });

        // Dropdowns
        const dropdowns = ['rampPattern', 'weekendBoost', 'productivityBoost'];
        dropdowns.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.handleInputChange(id, element.value));
            }
        });

        // Radio buttons for webinar duration
        const radios = document.querySelectorAll('input[name="webinarDuration"]');
        radios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.checked) {
                    this.handleInputChange('webinarDuration', parseInt(radio.value));
                }
            });
        });

        // Footer buttons
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToCSV());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveConfiguration());
    }

    handleInputChange(key, value) {
        // Convert to appropriate type
        if (['targetTasks', 'targetPeriodWeeks', 'dailyHours', 'wtAttempters', 'wtReviewers', 'totalMissions', 'webinarDuration'].includes(key)) {
            this.config[key] = parseInt(value);
        } else if (['l1AHT', 'l0AHT', 'cost30min', 'cost60min'].includes(key)) {
            this.config[key] = parseFloat(value);
        } else if (['sbqRate', 'activationRate', 'screeningRate', 'weekendBoost', 'productivityBoost'].includes(key)) {
            this.config[key] = parseInt(value);
        } else {
            this.config[key] = value;
        }

        this.calculateMetrics();
        this.updateUI();
        this.updateCharts();
    }

    updateSliderValue(id, value) {
        const valueSpan = document.querySelector(`#${id}`).parentElement.querySelector('.slider-value');
        if (valueSpan) {
            valueSpan.textContent = `${value}%`;
        }
    }

    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                // Remove active class from all tabs and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding content
                button.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
                
                // Update charts when tab becomes visible
                setTimeout(() => {
                    if (this.charts[tabId]) {
                        this.charts[tabId].resize();
                    }
                }, 100);
            });
        });
    }

    setupCollapsibleSections() {
        const sectionHeaders = document.querySelectorAll('.section-header');
        
        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const sectionId = header.getAttribute('data-section') + '-section';
                const content = document.getElementById(sectionId);
                const icon = header.querySelector('.collapse-icon');
                
                if (content.classList.contains('collapsed')) {
                    content.classList.remove('collapsed');
                    header.classList.remove('collapsed');
                    icon.textContent = '−';
                } else {
                    content.classList.add('collapsed');
                    header.classList.add('collapsed');
                    icon.textContent = '+';
                }
            });
        });
    }

    calculateMetrics() {
        const config = this.config;
        
        // Base calculations
        const workingDaysPerWeek = 5;
        const weekendDaysPerWeek = 2;
        const totalDays = config.targetPeriodWeeks * 7;
        const workingDays = config.targetPeriodWeeks * workingDaysPerWeek;
        const weekendDays = config.targetPeriodWeeks * weekendDaysPerWeek;
        
        // SBQ adjustment
        const l1Tasks = config.targetTasks / (1 - config.sbqRate / 100);
        const l0Tasks = l1Tasks * 0.7; // Fixed 70% yield
        
        // Effective workforce (considering activation and screening rates)
        const effectiveAttempters = config.wtAttempters * (config.activationRate / 100) * (config.screeningRate / 100);
        const effectiveReviewers = config.wtReviewers * (config.activationRate / 100) * (config.screeningRate / 100);
        
        // Calculate base task capacity per day based on workforce
        const baseCapacityPerDay = effectiveAttempters * config.dailyHours / config.l1AHT;
        
        // Calculate actual daily tasks based on capacity and target
        const totalTasksNeeded = l1Tasks + l0Tasks;
        const avgTasksPerDay = Math.min(totalTasksNeeded / totalDays, baseCapacityPerDay);
        
        // Apply weekend boost
        const weekendMultiplier = 1 + (config.weekendBoost / 100);
        const weekdayTasks = avgTasksPerDay;
        const weekendTasks = avgTasksPerDay * weekendMultiplier;
        
        // Calculate total hours
        const l1Hours = l1Tasks * config.l1AHT;
        const l0Hours = l0Tasks * config.l0AHT;
        const totalHours = l1Hours + l0Hours;
        
        // Calculate peak CBs required
        const peakDailyHours = Math.max(weekdayTasks * config.l1AHT, weekendTasks * config.l1AHT);
        const peakCBs = Math.ceil(peakDailyHours / config.dailyHours);
        
        // Calculate effective AHT
        const effectiveAHT = (l1Hours + l0Hours) / (l1Tasks + l0Tasks);
        
        // Bonus mission costs
        const selectedWebinarCost = config.webinarDuration === 30 ? config.cost30min : config.cost60min;
        const costOfMissions = config.wtAttempters * selectedWebinarCost;
        const totalCostOfMissions = config.totalMissions * costOfMissions;
        
        // Store calculated metrics
        this.metrics = {
            dailyTasksWeekdays: Math.round(weekdayTasks),
            dailyTasksWeekends: Math.round(weekendTasks),
            dailyAttempters: Math.round(effectiveAttempters),
            dailyReviewers: Math.round(effectiveReviewers),
            avgDailyTasks: Math.round(avgTasksPerDay),
            totalProjectHours: Math.round(totalHours),
            peakCBs: peakCBs,
            effectiveAHT: effectiveAHT.toFixed(2),
            l1Tasks: Math.round(l1Tasks),
            l0Tasks: Math.round(l0Tasks),
            costOfMissions: costOfMissions,
            totalCostOfMissions: totalCostOfMissions
        };
        
        // Generate daily breakdown for charts
        this.generateDailyBreakdown();
    }

    generateDailyBreakdown() {
        const config = this.config;
        const totalDays = config.targetPeriodWeeks * 7;
        const dailyData = [];
        
        for (let day = 1; day <= totalDays; day++) {
            const isWeekend = day % 7 === 0 || day % 7 === 6;
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day % 7];
            
            // Apply ramp pattern
            let rampMultiplier = 1;
            switch (config.rampPattern) {
                case 'Linear':
                    rampMultiplier = day / totalDays;
                    break;
                case 'Exponential':
                    rampMultiplier = Math.pow(day / totalDays, 2);
                    break;
                case 'S-Curve':
                    const x = (day / totalDays) * 6 - 3; // Map to -3 to 3
                    rampMultiplier = 1 / (1 + Math.exp(-x));
                    break;
            }
            
            // Calculate tasks for this day
            const baseTasks = isWeekend ? this.metrics.dailyTasksWeekends : this.metrics.dailyTasksWeekdays;
            const adjustedTasks = Math.round(baseTasks * rampMultiplier);
            
            // Calculate AHT (improving over time)
            const ahtImprovement = 1 - (day / totalDays) * 0.1; // 10% improvement by end
            const dailyAHT = config.l1AHT * ahtImprovement;
            
            dailyData.push({
                day,
                dayName,
                isWeekend,
                tasks: adjustedTasks,
                aht: dailyAHT,
                hours: adjustedTasks * dailyAHT,
                attempters: Math.round(this.metrics.dailyAttempters * rampMultiplier),
                reviewers: Math.round(this.metrics.dailyReviewers * rampMultiplier)
            });
        }
        
        this.dailyBreakdown = dailyData;
    }

    updateUI() {
        // Update metric cards
        Object.keys(this.metrics).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (key.includes('Cost')) {
                    element.textContent = this.metrics[key].toLocaleString();
                } else {
                    element.textContent = this.metrics[key];
                }
            }
        });
        
        // Update cost displays
        document.getElementById('costOfMissions').textContent = this.metrics.costOfMissions.toLocaleString();
        document.getElementById('totalCostOfMissions').textContent = this.metrics.totalCostOfMissions.toLocaleString();
    }

    initializeCharts() {
        this.createTimelineChart();
        this.createResourcesChart();
        this.createAHTChart();
    }

    updateCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.update) {
                chart.update();
            }
        });
        
        // Recreate charts with new data
        this.createTimelineChart();
        this.createResourcesChart();
        this.createAHTChart();
    }

    createTimelineChart() {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;
        
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }
        
        const labels = this.dailyBreakdown.map(d => `Day ${d.day}`);
        const weekdayTasks = this.dailyBreakdown.filter(d => !d.isWeekend).map(d => d.tasks);
        const weekendTasks = this.dailyBreakdown.filter(d => d.isWeekend).map(d => d.tasks);
        const weekdayLabels = this.dailyBreakdown.filter(d => !d.isWeekend).map(d => `Day ${d.day}`);
        const weekendLabels = this.dailyBreakdown.filter(d => d.isWeekend).map(d => `Day ${d.day}`);
        
        this.charts.timeline = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Weekday Tasks',
                    data: this.dailyBreakdown.map(d => d.isWeekend ? 0 : d.tasks),
                    backgroundColor: '#1FB8CD',
                    borderColor: '#1FB8CD',
                    borderWidth: 1
                }, {
                    label: 'Weekend Tasks',
                    data: this.dailyBreakdown.map(d => d.isWeekend ? d.tasks : 0),
                    backgroundColor: '#FFC185',
                    borderColor: '#FFC185',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Task Distribution',
                        color: '#F8FAFC'
                    },
                    legend: {
                        labels: {
                            color: '#F8FAFC'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#94A3B8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#94A3B8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    }
                }
            }
        });
    }

    createResourcesChart() {
        const ctx = document.getElementById('resourcesChart');
        if (!ctx) return;
        
        if (this.charts.resources) {
            this.charts.resources.destroy();
        }
        
        const labels = this.dailyBreakdown.map(d => `Day ${d.day}`);
        
        this.charts.resources = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Attempters',
                    data: this.dailyBreakdown.map(d => d.attempters),
                    borderColor: '#B4413C',
                    backgroundColor: 'rgba(180, 65, 60, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Reviewers',
                    data: this.dailyBreakdown.map(d => d.reviewers),
                    borderColor: '#ECEBD5',
                    backgroundColor: 'rgba(236, 235, 213, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Resource Allocation Over Time',
                        color: '#F8FAFC'
                    },
                    legend: {
                        labels: {
                            color: '#F8FAFC'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#94A3B8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#94A3B8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    }
                }
            }
        });
    }

    createAHTChart() {
        const ctx = document.getElementById('ahtChart');
        if (!ctx) return;
        
        if (this.charts.aht) {
            this.charts.aht.destroy();
        }
        
        const labels = this.dailyBreakdown.map(d => `Day ${d.day}`);
        
        this.charts.aht = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average AHT (hours)',
                    data: this.dailyBreakdown.map(d => d.aht.toFixed(3)),
                    borderColor: '#5D878F',
                    backgroundColor: 'rgba(93, 135, 143, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'AHT During Project',
                        color: '#F8FAFC'
                    },
                    legend: {
                        labels: {
                            color: '#F8FAFC'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#94A3B8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#94A3B8'
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)'
                        }
                    }
                }
            }
        });
    }

    exportToCSV() {
        const data = [
            ['Metric', 'Value'],
            ['Project Name', this.config.projectName],
            ['Target Tasks', this.config.targetTasks],
            ['Target Period (weeks)', this.config.targetPeriodWeeks],
            ['Daily Tasks (Weekdays)', this.metrics.dailyTasksWeekdays],
            ['Daily Tasks (Weekends)', this.metrics.dailyTasksWeekends],
            ['Daily Attempters', this.metrics.dailyAttempters],
            ['Daily Reviewers', this.metrics.dailyReviewers],
            ['Average Daily Tasks', this.metrics.avgDailyTasks],
            ['Total Project Hours', this.metrics.totalProjectHours],
            ['Peak CBs Required', this.metrics.peakCBs],
            ['Effective AHT per Task', this.metrics.effectiveAHT]
        ];
        
        const csvContent = data.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.config.projectName.replace(/\s+/g, '_')}_ramp_plan.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    saveConfiguration() {
        const configData = JSON.stringify(this.config, null, 2);
        const blob = new Blob([configData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.config.projectName.replace(/\s+/g, '_')}_config.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.rampApp = new RampPlanningApp();
});
