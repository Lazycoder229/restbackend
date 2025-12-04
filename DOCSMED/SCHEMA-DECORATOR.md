<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FynixJS ORM Explorer</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Fira+Code:wght@400;600&display=swap');
        
        body { font-family: 'Inter', sans-serif; }
        pre, code { font-family: 'Fira Code', monospace; }

        .chart-container {
            position: relative;
            width: 100%;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            height: 300px;
            max-height: 400px;
        }
        
        @media (min-width: 768px) {
            .chart-container {
                height: 350px;
            }
        }

        /* Custom Scrollbar for code blocks */
        .code-scroll::-webkit-scrollbar {
            height: 8px;
            width: 8px;
        }
        .code-scroll::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        .code-scroll::-webkit-scrollbar-thumb {
            background: #d6d3d1;
            border-radius: 4px;
        }
        .code-scroll::-webkit-scrollbar-thumb:hover {
            background: #a8a29e;
        }

        .tab-active {
            border-bottom: 2px solid #ea580c; /* Orange-600 */
            color: #ea580c;
            font-weight: 600;
        }
        .tab-inactive {
            color: #78716c; /* Stone-500 */
        }
        .tab-inactive:hover {
            color: #44403c; /* Stone-700 */
        }
    </style>
    <!-- Chosen Palette: Warm Stone & Burnt Orange. Backgrounds are Warm Neutrals (Stone-50/100). Primary text is Stone-800. Accents are Orange-600 to provide a calm but focused 'architectural' feel suitable for structural documentation. -->
</head>
<body class="bg-stone-50 text-stone-800 leading-relaxed">

    <!-- Application Structure Plan: 
         1. Header: Simple branding and definition of the FynixJS ORM context.
         2. Overview Dashboard: A high-level view of the available decorators grouped by function (Column vs. Relation vs. Index) using Chart.js to show the 'Toolbox' composition.
         3. Interactive Reference & Playground: The core section. Split into two columns:
            - Left: A selectable list/menu of decorators (@Column, @ForeignKey, etc.).
            - Right: A dynamic content area that changes based on selection. It includes:
              - 'Concept': Explanation text.
              - 'Syntax': Code snippet.
              - 'Playground': A form builder where users can toggle options (like isUnique, type) and see the generated TypeScript code update live.
         4. Relationship visualizer: A CSS-based diagram to explain @ForeignKey concepts without SVG.
         5. Metadata Dictionary: A searchable table for the underlying Metadata interfaces (ColumnMetadata, etc.).
         This structure moves from abstract (stats) to concrete (builder) to reference (tables), facilitating different learning modes.
    -->

    <!-- Header -->
    <header class="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="text-2xl">🏛️</span>
                <h1 class="text-xl font-bold tracking-tight text-stone-900">FynixJS <span class="text-orange-600">ORM Architect</span></h1>
            </div>
            <nav class="hidden md:flex space-x-8">
                <button onclick="scrollToSection('dashboard')" class="text-stone-600 hover:text-orange-600 transition-colors">Dashboard</button>
                <button onclick="scrollToSection('builder')" class="text-stone-600 hover:text-orange-600 transition-colors">Schema Builder</button>
                <button onclick="scrollToSection('metadata')" class="text-stone-600 hover:text-orange-600 transition-colors">Metadata Ref</button>
            </nav>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">

        <!-- Intro Section -->
        <section id="dashboard" class="space-y-6">
            <div class="max-w-3xl">
                <h2 class="text-3xl font-bold text-stone-900">Define Your Data Structure</h2>
                <p class="mt-4 text-lg text-stone-600">
                    FynixJS leverages <code>reflect-metadata</code> to map your TypeScript classes directly to database tables. 
                    This interactive guide explores the three pillars of schema definition: <strong>Columns</strong>, <strong>Indices</strong>, and <strong>Relationships</strong>.
                    Explore the tools below to understand how to construct robust Entities.
                </p>
            </div>

            <!-- Visualization & Content Choices: 
                 - Goal: Inform the user about the scope of the ORM tools available.
                 - Method: Doughnut Chart (Chart.js).
                 - Justification: Shows the categorization of decorators (Data Definition vs. Data Integrity vs. Relationships).
                 - Interaction: Hover to see count of decorators in each category.
            -->
            <!-- CONFIRMATION: NO SVG graphics used. NO Mermaid JS used. -->
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-xl shadow-sm border border-stone-100">
                <div class="flex flex-col justify-center">
                    <h3 class="text-lg font-semibold mb-2">Decorator Landscape</h3>
                    <p class="text-sm text-stone-500 mb-6">Breakdown of available tools for Entity definition.</p>
                    <ul class="space-y-3">
                        <li class="flex items-center justify-between p-2 bg-orange-50 rounded border-l-4 border-orange-500">
                            <span class="font-medium text-stone-700">Columns</span>
                            <span class="text-sm text-stone-500">Defines data types & constraints</span>
                        </li>
                        <li class="flex items-center justify-between p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                            <span class="font-medium text-stone-700">Indices</span>
                            <span class="text-sm text-stone-500">Optimizes query performance</span>
                        </li>
                        <li class="flex items-center justify-between p-2 bg-purple-50 rounded border-l-4 border-purple-500">
                            <span class="font-medium text-stone-700">Relations</span>
                            <span class="text-sm text-stone-500">Links tables (Foreign Keys)</span>
                        </li>
                    </ul>
                </div>
                <div class="flex flex-col items-center">
                    <div class="chart-container">
                        <canvas id="decoratorChart"></canvas>
                    </div>
                </div>
            </div>
        </section>

        <!-- Interactive Builder / Deep Dive Section -->
        <section id="builder" class="space-y-6">
            <div class="border-b border-stone-200 pb-2">
                <h2 class="text-2xl font-bold text-stone-900">Interactive Schema Builder</h2>
                <p class="mt-2 text-stone-600">Select a decorator concept on the left to configure it and view the generated TypeScript code.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <!-- Navigation Menu -->
                <div class="lg:col-span-3 space-y-2">
                    <p class="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">Property Decorators</p>
                    <button onclick="loadDecorator('column')" id="btn-column" class="w-full text-left px-4 py-3 rounded-lg transition-all bg-orange-100 text-orange-800 border border-orange-200 font-semibold shadow-sm hover:shadow-md">
                        @Column
                    </button>
                    <button onclick="loadDecorator('primary')" id="btn-primary" class="w-full text-left px-4 py-3 rounded-lg transition-all hover:bg-stone-100 text-stone-600 border border-transparent">
                        @PrimaryGeneratedColumn
                    </button>
                    
                    <p class="text-xs font-bold uppercase tracking-wider text-stone-400 mt-6 mb-2">Class Decorators</p>
                    <button onclick="loadDecorator('index')" id="btn-index" class="w-full text-left px-4 py-3 rounded-lg transition-all hover:bg-stone-100 text-stone-600 border border-transparent">
                        @Index / @Unique
                    </button>
                    <button onclick="loadDecorator('foreignkey')" id="btn-foreignkey" class="w-full text-left px-4 py-3 rounded-lg transition-all hover:bg-stone-100 text-stone-600 border border-transparent">
                        @ForeignKey
                    </button>
                </div>

                <!-- Main Content Area -->
                <div class="lg:col-span-9 bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex flex-col min-h-[600px]">
                    
                    <!-- Dynamic Header -->
                    <div class="px-8 py-6 border-b border-stone-100 bg-stone-50/50">
                        <div class="flex items-center justify-between">
                            <h3 id="detail-title" class="text-2xl font-bold text-stone-800">@Column</h3>
                            <span id="detail-type" class="px-3 py-1 bg-stone-200 text-stone-600 text-xs font-mono rounded-full">Property Decorator</span>
                        </div>
                        <p id="detail-desc" class="mt-2 text-stone-600">Marks a property as a standard database column. Used for primitives like strings, numbers, and booleans.</p>
                    </div>

                    <div class="flex-1 p-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
                        
                        <!-- Configuration Form (The "Playground") -->
                        <div class="space-y-6">
                            <h4 class="text-sm font-bold uppercase tracking-wider text-stone-400">Configure Options</h4>
                            <div id="config-panel" class="space-y-4">
                                <!-- Dynamic Form Elements Injected Here via JS -->
                            </div>
                        </div>

                        <!-- Code Preview -->
                        <div class="bg-stone-900 rounded-lg p-6 relative overflow-hidden flex flex-col">
                            <div class="absolute top-0 left-0 w-full h-8 bg-stone-800 flex items-center px-4 space-x-2">
                                <div class="w-3 h-3 rounded-full bg-red-500"></div>
                                <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                                <span class="text-xs text-stone-400 ml-4 font-mono">entity.ts</span>
                            </div>
                            <div class="mt-6 flex-1 flex flex-col justify-center">
                                <pre class="text-sm text-stone-300 font-mono code-scroll overflow-x-auto"><code id="code-preview">
@Entity('users')
export class User extends BaseEntity {

  @Column({
    type: 'varchar',
    length: 100
  })
  username: string;

}</code></pre>
                            </div>
                            <div class="mt-4 pt-4 border-t border-stone-800">
                                <p class="text-xs text-stone-500">Live Preview: Changes in the configuration panel update this code instantly.</p>
                            </div>
                        </div>
                    </div>

                    <!-- Documentation Table (Contextual) -->
                    <div class="px-8 py-6 bg-stone-50 border-t border-stone-200">
                        <h4 class="text-sm font-bold text-stone-900 mb-4">Available Options</h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm text-left text-stone-600">
                                <thead class="text-xs text-stone-700 uppercase bg-stone-200">
                                    <tr>
                                        <th class="px-4 py-2 rounded-l-md">Option</th>
                                        <th class="px-4 py-2">Type</th>
                                        <th class="px-4 py-2 rounded-r-md">Description</th>
                                    </tr>
                                </thead>
                                <tbody id="options-table-body" class="bg-white divide-y divide-stone-100">
                                    <!-- Dynamic Rows -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Metadata Reference Table -->
        <section id="metadata" class="space-y-6 pb-12">
            <div class="max-w-3xl">
                <h2 class="text-2xl font-bold text-stone-900">Metadata Reference Keys</h2>
                <p class="mt-2 text-stone-600">
                    FynixJS stores schema definitions using <code>Reflect.defineMetadata</code>. 
                    These are the constants used internally by the framework.
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Card 1 -->
                <div class="bg-white p-6 rounded-lg border border-stone-200 hover:border-orange-300 transition-colors shadow-sm">
                    <div class="text-xs font-mono text-orange-600 bg-orange-50 inline-block px-2 py-1 rounded mb-3">COLUMN_METADATA</div>
                    <h3 class="text-lg font-semibold text-stone-900">"column:metadata"</h3>
                    <p class="text-sm text-stone-500 mt-2">Stores array of <code>ColumnMetadata</code> objects defining table columns.</p>
                </div>
                <!-- Card 2 -->
                <div class="bg-white p-6 rounded-lg border border-stone-200 hover:border-blue-300 transition-colors shadow-sm">
                    <div class="text-xs font-mono text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded mb-3">INDEX_METADATA</div>
                    <h3 class="text-lg font-semibold text-stone-900">"index:metadata"</h3>
                    <p class="text-sm text-stone-500 mt-2">Stores array of <code>IndexMetadata</code> objects for database indices.</p>
                </div>
                <!-- Card 3 -->
                <div class="bg-white p-6 rounded-lg border border-stone-200 hover:border-purple-300 transition-colors shadow-sm">
                    <div class="text-xs font-mono text-purple-600 bg-purple-50 inline-block px-2 py-1 rounded mb-3">FOREIGN_KEY_METADATA</div>
                    <h3 class="text-lg font-semibold text-stone-900">"foreignkey:metadata"</h3>
                    <p class="text-sm text-stone-500 mt-2">Stores array of <code>ForeignKeyMetadata</code> for table relationships.</p>
                </div>
            </div>
        </section>

    </main>

    <footer class="bg-stone-900 text-stone-400 py-12 mt-12">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <p>&copy; FynixJS Documentation Visualization. Based on <code>reflect-metadata</code> architecture.</p>
        </div>
    </footer>

    <!-- JavaScript Logic -->
    <script>
        // --- DATA STORE ---
        const decorators = {
            column: {
                title: "@Column",
                type: "Property Decorator",
                desc: "Marks a property as a standard database column. Supports various types, constraints, and defaults.",
                defaultCode: {
                    name: "email",
                    type: "varchar",
                    length: 100,
                    isUnique: true,
                    isNullable: false
                },
                options: [
                    { name: "type", type: "string", desc: "Database type (e.g., 'varchar', 'int')" },
                    { name: "length", type: "number", desc: "Length for string types" },
                    { name: "precision", type: "number", desc: "Total digits (decimals)" },
                    { name: "scale", type: "number", desc: "Decimal places" },
                    { name: "isUnique", type: "boolean", desc: "Enforces unique constraint" },
                    { name: "isNullable", type: "boolean", desc: "Allows NULL values" },
                    { name: "default", type: "any", desc: "Default value" }
                ],
                form: [
                    { id: "propName", label: "Property Name", type: "text", value: "email" },
                    { id: "colType", label: "Type", type: "select", options: ["varchar", "int", "text", "decimal", "boolean"], value: "varchar" },
                    { id: "length", label: "Length", type: "number", value: 100 },
                    { id: "isUnique", label: "Is Unique", type: "checkbox", value: true },
                    { id: "isNullable", label: "Is Nullable", type: "checkbox", value: false }
                ]
            },
            primary: {
                title: "@PrimaryGeneratedColumn",
                type: "Property Decorator",
                desc: "Convenience decorator. Creates an auto-incrementing, unsigned primary key. Equivalent to @Column({ isPrimary: true, ... })",
                defaultCode: {
                    name: "id",
                    type: "int"
                },
                options: [
                    { name: "type", type: "'int' | 'bigint'", desc: "Integer size for the ID" }
                ],
                form: [
                    { id: "propName", label: "Property Name", type: "text", value: "id" },
                    { id: "colType", label: "Type", type: "select", options: ["int", "bigint"], value: "int" }
                ]
            },
            index: {
                title: "@Index / @Unique",
                type: "Class Decorator",
                desc: "Creates database indices for performance or uniqueness constraints on one or more columns.",
                defaultCode: {
                    columns: "firstName, lastName",
                    name: "name_idx",
                    isUnique: false
                },
                options: [
                    { name: "columns", type: "string[]", desc: "Array of column names" },
                    { name: "isUnique", type: "boolean", desc: "Enforce uniqueness" },
                    { name: "name", type: "string", desc: "Custom index name" }
                ],
                form: [
                    { id: "idxColumns", label: "Columns (comma separated)", type: "text", value: "firstName, lastName" },
                    { id: "idxName", label: "Index Name (Optional)", type: "text", value: "name_idx" },
                    { id: "isUnique", label: "Is Unique (@Unique)", type: "checkbox", value: false }
                ]
            },
            foreignkey: {
                title: "@ForeignKey",
                type: "Class Decorator",
                desc: "Defines a relationship to another table. Ensures referential integrity with CASCADE/RESTRICT options.",
                defaultCode: {
                    column: "authorId",
                    refTable: "users",
                    refCol: "id",
                    onDelete: "CASCADE"
                },
                options: [
                    { name: "column", type: "string", desc: "Local column name" },
                    { name: "referencedTable", type: "string", desc: "Target table name" },
                    { name: "referencedColumn", type: "string", desc: "Target column name" },
                    { name: "onDelete", type: "enum", desc: "Action on deletion (CASCADE, etc.)" }
                ],
                form: [
                    { id: "fkColumn", label: "Local Column", type: "text", value: "authorId" },
                    { id: "refTable", label: "Referenced Table", type: "text", value: "users" },
                    { id: "refCol", label: "Referenced Column", type: "text", value: "id" },
                    { id: "onDelete", label: "On Delete", type: "select", options: ["CASCADE", "SET NULL", "RESTRICT", "NO ACTION"], value: "CASCADE" }
                ]
            }
        };

        let currentDecorator = 'column';

        // --- CHART INITIALIZATION ---
        document.addEventListener('DOMContentLoaded', () => {
            const ctx = document.getElementById('decoratorChart').getContext('2d');
            
            // Visualization Logic:
            // Using a doughnut chart to show the 'weight' or distribution of different metadata types.
            // Colors match the text highlights in the UI (Orange, Blue, Purple).
            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Column Defs', 'Indices', 'Relations'],
                    datasets: [{
                        data: [12, 5, 4], // Arbitrary weight representing common usage frequency
                        backgroundColor: [
                            'rgba(234, 88, 12, 0.8)', // Orange-600
                            'rgba(59, 130, 246, 0.8)', // Blue-500
                            'rgba(147, 51, 234, 0.8)'  // Purple-600
                        ],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const labels = [
                                        "Field types, Length, Precision, Nullability",
                                        "Performance Indexes, Unique Constraints",
                                        "Foreign Keys, Cascades, Integrity"
                                    ];
                                    return labels[context.dataIndex];
                                }
                            }
                        }
                    },
                    cutout: '70%'
                }
            });

            // Init first view
            loadDecorator('column');
        });

        // --- NAVIGATION & RENDER LOGIC ---
        function loadDecorator(key) {
            currentDecorator = key;
            const data = decorators[key];

            // Update Active Button State
            document.querySelectorAll('[id^="btn-"]').forEach(btn => {
                btn.classList.remove('bg-orange-100', 'text-orange-800', 'border-orange-200', 'font-semibold', 'shadow-sm');
                btn.classList.add('hover:bg-stone-100', 'text-stone-600', 'border-transparent');
            });
            const activeBtn = document.getElementById(`btn-${key}`);
            activeBtn.classList.remove('hover:bg-stone-100', 'text-stone-600', 'border-transparent');
            activeBtn.classList.add('bg-orange-100', 'text-orange-800', 'border-orange-200', 'font-semibold', 'shadow-sm');

            // Update Header info
            document.getElementById('detail-title').innerText = data.title;
            document.getElementById('detail-type').innerText = data.type;
            document.getElementById('detail-desc').innerText = data.desc;

            // Render Form Options
            const formContainer = document.getElementById('config-panel');
            formContainer.innerHTML = ''; // Clear previous

            data.form.forEach(field => {
                const wrapper = document.createElement('div');
                
                const label = document.createElement('label');
                label.className = "block text-xs font-medium text-stone-700 mb-1";
                label.innerText = field.label;
                wrapper.appendChild(label);

                let input;
                if (field.type === 'select') {
                    input = document.createElement('select');
                    input.className = "w-full rounded-md border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border";
                    field.options.forEach(opt => {
                        const option = document.createElement('option');
                        option.value = opt;
                        option.text = opt;
                        if(opt === field.value) option.selected = true;
                        input.appendChild(option);
                    });
                } else if (field.type === 'checkbox') {
                    // Wrapper for checkbox to align row
                    wrapper.className = "flex items-center space-x-2 mt-4";
                    label.className = "text-sm text-stone-700"; // Reset label class for checkbox
                    label.innerText = field.label;
                    
                    input = document.createElement('input');
                    input.type = "checkbox";
                    input.className = "h-4 w-4 text-orange-600 focus:ring-orange-500 border-stone-300 rounded";
                    input.checked = field.value;
                    
                    wrapper.innerHTML = ''; // Clear because order is different
                    wrapper.appendChild(input);
                    wrapper.appendChild(label);
                } else {
                    input = document.createElement('input');
                    input.type = field.type;
                    input.className = "w-full rounded-md border-stone-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2 border";
                    input.value = field.value;
                }

                input.id = `input-${field.id}`;
                // Add event listener for real-time updates
                input.addEventListener('input', updateCodePreview);
                input.addEventListener('change', updateCodePreview); // For select/checkbox

                if(field.type !== 'checkbox') wrapper.appendChild(input);
                formContainer.appendChild(wrapper);
            });

            // Render Options Table
            const tableBody = document.getElementById('options-table-body');
            tableBody.innerHTML = '';
            data.options.forEach(opt => {
                const row = `
                    <tr class="hover:bg-stone-50 transition-colors">
                        <td class="px-4 py-2 font-mono text-xs text-orange-700 font-medium">${opt.name}</td>
                        <td class="px-4 py-2 font-mono text-xs text-stone-500">${opt.type}</td>
                        <td class="px-4 py-2">${opt.desc}</td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });

            // Initial Code Render
            updateCodePreview();
        }

        // --- CODE GENERATION LOGIC ---
        function updateCodePreview() {
            let code = "";
            const key = currentDecorator;

            if (key === 'column') {
                const name = document.getElementById('input-propName').value;
                const type = document.getElementById('input-colType').value;
                const length = document.getElementById('input-length').value;
                const isUnique = document.getElementById('input-isUnique').checked;
                const isNullable = document.getElementById('input-isNullable').checked;

                code = `
@Entity('users')
export class User extends BaseEntity {

  @Column({
    type: '${type}',${type === 'varchar' ? `\n    length: ${length},` : ''}${isUnique ? `\n    isUnique: true,` : ''}${isNullable ? `\n    isNullable: true,` : ''}
  })
  ${name}: ${mapJsType(type)};

}`;
            } else if (key === 'primary') {
                const name = document.getElementById('input-propName').value;
                const type = document.getElementById('input-colType').value;
                
                code = `
@Entity('users')
export class User extends BaseEntity {

  @PrimaryGeneratedColumn(${type === 'bigint' ? `{ type: 'bigint' }` : ''})
  ${name}: number;

}`;
            } else if (key === 'index') {
                const colsRaw = document.getElementById('input-idxColumns').value;
                const name = document.getElementById('input-idxName').value;
                const isUnique = document.getElementById('input-isUnique').checked;
                
                // Parse columns string to array format for display
                const cols = colsRaw.split(',').map(s => `'${s.trim()}'`).join(', ');

                if (isUnique) {
                    code = `
@Entity('users')
@Unique([${cols}])
export class User extends BaseEntity {
  // ... properties
}`;
                } else {
                    code = `
@Entity('users')
@Index([${cols}]${name ? `, { name: '${name}' }` : ''})
export class User extends BaseEntity {
  // ... properties
}`;
                }
            } else if (key === 'foreignkey') {
                const local = document.getElementById('input-fkColumn').value;
                const refTable = document.getElementById('input-refTable').value;
                const refCol = document.getElementById('input-refCol').value;
                const onDelete = document.getElementById('input-onDelete').value;

                code = `
@Entity('posts')
@ForeignKey({
  column: '${local}',
  referencedTable: '${refTable}',
  referencedColumn: '${refCol}',
  onDelete: '${onDelete}'
})
export class Post extends BaseEntity {

  @Column({ type: 'int' })
  ${local}: number;

}`;
            }

            // Escape HTML for safety inside <pre>
            const escapedCode = code.replace(/[&<>"']/g, function(m) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
            });

            document.getElementById('code-preview').innerHTML = escapedCode;
        }

        // Helper: Map SQL types to TS types
        function mapJsType(sqlType) {
            if(['int', 'decimal', 'float', 'double'].includes(sqlType)) return 'number';
            if(['boolean', 'tinyint'].includes(sqlType)) return 'boolean';
            return 'string';
        }

        function scrollToSection(id) {
            document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
        }
    </script>
</body>
</html>
