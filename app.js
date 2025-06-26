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
            targetPeriodDays: 0,
            startDate: new Date().toISOString().split('T')[0],
            qms: 0,
            consultants: 0,
            l1AHT: 0.5,        // L-1 AHT
            l0AHT: 0.32,
            sbqRateL0: 15,
            l1StageAHT: 0.45,
            sbqRateL1: 10,
            l4StageAHT: 0.55,
            sbqRateL4: 8,
            l10StageAHT: 0.6,
            sbqRateL10: 5,
            l12StageAHT: 0.65,
            sbqRateL12: 3,
            activeLayers: [-1, 0, 1, 4, 10, 12],
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
        const startDateInput = document.getElementById('startDate');
        if (startDateInput) {
            startDateInput.value = this.config.startDate;
        }
        this.updateLayerVisibility();
        this.setupTabs();
        this.setupCollapsibleSections();
        this.calculateMetrics();
        this.initializeCharts();
        this.updateUI();
    }

    bindEvents() {
        // Form inputs
        const inputs = [
            'projectName', 'targetTasks', 'targetPeriodWeeks', 'targetPeriodDays', 'startDate',
            'qms', 'consultants',
            'l1AHT', 'l0AHT', 'l1StageAHT', 'l4StageAHT', 'l10StageAHT', 'l12StageAHT',
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
        const sliders = ['sbqRateL0', 'sbqRateL1', 'sbqRateL4', 'sbqRateL10', 'sbqRateL12', 'activationRate', 'screeningRate'];
        sliders.forEach(id => {
            const element = document.getElementById(id);
            const numInput = document.getElementById(`${id}Input`);
            if (element) {
                element.addEventListener('input', () => {
                    if (numInput) numInput.value = element.value;
                    this.handleInputChange(id, element.value);
                    this.updateSliderValue(id, element.value);
                });
            }
            if (numInput) {
                numInput.addEventListener('input', () => {
                    element.value = numInput.value;
                    this.handleInputChange(id, numInput.value);
                    this.updateSliderValue(id, numInput.value);
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

        const layerRadios = document.querySelectorAll('#layerRadios input[name="layer"]');
        if (layerRadios.length) {
            layerRadios.forEach(cb => {
                cb.addEventListener('change', () => {
                    const selected = Array.from(layerRadios).filter(el => el.checked).map(el => parseInt(el.value));
                    this.handleLayerSelection(selected);
                });
            });
        }

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
        if (['targetTasks', 'targetPeriodWeeks', 'targetPeriodDays', 'dailyHours', 'wtAttempters', 'wtReviewers', 'totalMissions', 'webinarDuration', 'qms', 'consultants'].includes(key)) {
            this.config[key] = parseInt(value);
        } else if (['l1AHT', 'l0AHT', 'l1StageAHT', 'l4StageAHT', 'l10StageAHT', 'l12StageAHT', 'cost30min', 'cost60min'].includes(key)) {
            this.config[key] = parseFloat(value);
        } else if (['sbqRateL0', 'sbqRateL1', 'sbqRateL4', 'sbqRateL10', 'sbqRateL12', 'activationRate', 'screeningRate', 'weekendBoost', 'productivityBoost'].includes(key)) {
            this.config[key] = parseInt(value);
        } else {
            this.config[key] = value;
        }

        this.calculateMetrics();
        this.updateUI();
        this.updateCharts();
    }

    updateSliderValue(id, value) {
        const parent = document.getElementById(id)?.parentElement;
        if (!parent) return;
        const valueSpan = parent.querySelector('.slider-value');
        if (valueSpan) {
            valueSpan.textContent = `${value}%`;
        }
        const numInput = parent.querySelector('.slider-number');
        if (numInput) {
            numInput.value = value;
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
        const totalDays = config.targetPeriodDays || (config.targetPeriodWeeks * 7);
        const workingDays = (totalDays / 7) * workingDaysPerWeek;
        const weekendDays = (totalDays / 7) * weekendDaysPerWeek;
        
        // SBQ adjustment
        const l1Tasks = config.targetTasks;
        const l0Tasks = l1Tasks / (1 - config.sbqRateL0 / 100);
        const l1StageTasks = l0Tasks / (1 - config.sbqRateL1 / 100);
        const l4StageTasks = l1StageTasks / (1 - config.sbqRateL4 / 100);
        const l10StageTasks = l4StageTasks / (1 - config.sbqRateL10 / 100);
        const l12StageTasks = l10StageTasks / (1 - config.sbqRateL12 / 100);
        
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
        const l1StageHours = l1StageTasks * config.l1StageAHT;
        const l4StageHours = l4StageTasks * config.l4StageAHT;
        const l10StageHours = l10StageTasks * config.l10StageAHT;
        const l12StageHours = l12StageTasks * config.l12StageAHT;
        const totalHours = l1Hours + l0Hours + l1StageHours + l4StageHours + l10StageHours + l12StageHours;
        
        // Calculate peak CBs required
        const peakDailyHours = Math.max(weekdayTasks * config.l1AHT, weekendTasks * config.l1AHT);
        const peakCBs = Math.ceil(peakDailyHours / config.dailyHours);
        
        // Calculate effective AHT
        const effectiveAHT =
            (l1Hours + l0Hours + l1StageHours + l4StageHours + l10StageHours + l12StageHours) /
            config.targetTasks;
        
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
            l1StageTasks: Math.round(l1StageTasks),
            l4StageTasks: Math.round(l4StageTasks),
            l10StageTasks: Math.round(l10StageTasks),
            l12StageTasks: Math.round(l12StageTasks),
            costOfMissions: costOfMissions,
            totalCostOfMissions: totalCostOfMissions
        };
        
        // Generate daily breakdown for charts
        this.generateDailyBreakdown();
        this.calculateWeeklyAllocatedHours();
        this.calculateWeeklyWorkforce();
    }

    calculateWeeklyAllocatedHours() {
        const config = this.config;
        const weeks = Math.ceil((config.targetPeriodDays || config.targetPeriodWeeks * 7) / 7);
        const weeklyHours = [];
        for (let week = 0; week < weeks; week++) {
            const start = week * 7;
            const end = start + 7;
            const hours = this.dailyBreakdown
                .slice(start, end)
                .reduce((sum, d) => sum + (d.attempters + d.reviewers) * config.dailyHours, 0);
            weeklyHours.push(Math.round(hours));
        }
        this.metrics.weeklyAllocatedHours = weeklyHours;
    }

    calculateWeeklyWorkforce() {
        const config = this.config;
        const weeks = Math.ceil((config.targetPeriodDays || config.targetPeriodWeeks * 7) / 7);
        const weeklyAttempters = [];
        const weeklyReviewers = [];
        for (let week = 0; week < weeks; week++) {
            const start = week * 7;
            const end = start + 7;
            const days = this.dailyBreakdown.slice(start, end);
            const avgAttempters = days.reduce((sum, d) => sum + d.attempters, 0) / days.length;
            const avgReviewers = days.reduce((sum, d) => sum + d.reviewers, 0) / days.length;
            weeklyAttempters.push(Math.round(avgAttempters));
            weeklyReviewers.push(Math.round(avgReviewers));
        }
        this.metrics.weeklyAttempters = weeklyAttempters;
        this.metrics.weeklyReviewers = weeklyReviewers;
    }

    generateDailyBreakdown() {
        const config = this.config;
        const totalDays = config.targetPeriodDays || (config.targetPeriodWeeks * 7);
        const dailyData = [];
        const startDate = new Date(config.startDate);
        
        for (let day = 1; day <= totalDays; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + day - 1);
            const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
            const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];
            
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
            const dailyAHTs = {
                l1: config.l1AHT * ahtImprovement,
                l0: config.l0AHT * ahtImprovement,
                l1Stage: config.l1StageAHT * ahtImprovement,
                l4Stage: config.l4StageAHT * ahtImprovement,
                l10Stage: config.l10StageAHT * ahtImprovement,
                l12Stage: config.l12StageAHT * ahtImprovement
            };

            const dateLabel = currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            dailyData.push({
                day,
                date: dateLabel,
                dayName,
                isWeekend,
                tasks: adjustedTasks,
                aht: dailyAHTs.l1,
                ahts: dailyAHTs,
                hours: adjustedTasks * dailyAHTs.l1,
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
                if (Array.isArray(this.metrics[key])) {
                    element.textContent = this.metrics[key]
                        .map((val, idx) => `W${idx + 1}: ${val}`)
                        .join(', ');
                } else if (key.includes('Cost')) {
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

    handleLayerSelection(layers) {
        this.config.activeLayers = layers;
        this.updateLayerVisibility();
        this.calculateMetrics();
        this.updateUI();
        this.updateCharts();
    }

    updateLayerVisibility() {
        const groups = document.querySelectorAll('.layer-group');
        groups.forEach(group => {
            const layer = parseInt(group.dataset.layer);
            group.style.display = this.config.activeLayers.includes(layer) ? '' : 'none';
        });
    }

    createTimelineChart() {
        const ctx = document.getElementById('timelineChart');
        if (!ctx) return;
        
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }
        
        const labels = this.dailyBreakdown.map(d => d.date);
        const weekdayTasks = this.dailyBreakdown.filter(d => !d.isWeekend).map(d => d.tasks);
        const weekendTasks = this.dailyBreakdown.filter(d => d.isWeekend).map(d => d.tasks);
        const weekdayLabels = this.dailyBreakdown.filter(d => !d.isWeekend).map(d => d.date);
        const weekendLabels = this.dailyBreakdown.filter(d => d.isWeekend).map(d => d.date);
        
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
        
        const labels = this.dailyBreakdown.map(d => d.date);
        
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
        
        const labels = this.dailyBreakdown.map(d => d.date);
        
        const datasets = [
            { label: 'L-1', color: '#5D878F', key: 'l1' },
            { label: 'L0', color: '#1FB8CD', key: 'l0' },
            { label: 'L1', color: '#FFC185', key: 'l1Stage' },
            { label: 'L4', color: '#B4413C', key: 'l4Stage' },
            { label: 'L10', color: '#ECEBD5', key: 'l10Stage' },
            { label: 'L12', color: '#A084E8', key: 'l12Stage' }
        ].map(item => ({
            label: item.label,
            data: this.dailyBreakdown.map(d => d.ahts[item.key].toFixed(3)),
            borderColor: item.color,
            backgroundColor: item.color + '33',
            fill: true,
            tension: 0.4
        }));

        this.charts.aht = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
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
            ['Target Period (days)', this.config.targetPeriodDays || this.config.targetPeriodWeeks * 7],
            ['Start Date', this.config.startDate],
            ['Daily Tasks (Weekdays)', this.metrics.dailyTasksWeekdays],
            ['Daily Tasks (Weekends)', this.metrics.dailyTasksWeekends],
            ['Daily Attempters', this.metrics.dailyAttempters],
            ['Daily Reviewers', this.metrics.dailyReviewers],
            ['Average Daily Tasks', this.metrics.avgDailyTasks],
            ['Total Project Hours', this.metrics.totalProjectHours],
            ['Peak CBs Required', this.metrics.peakCBs],
            ['Effective AHT per Task', this.metrics.effectiveAHT],
            ['Weekly Allocated Hours', this.metrics.weeklyAllocatedHours.join('; ')]
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
        const data = {
            config: this.config,
            weeklyAttempters: this.metrics.weeklyAttempters,
            weeklyReviewers: this.metrics.weeklyReviewers
        };
        const configData = JSON.stringify(data, null, 2);
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
