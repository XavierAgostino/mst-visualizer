# MST Algorithm Visualizer

![MST Visualizer](https://img.shields.io/badge/MST-Visualizer-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC)

An interactive educational tool that visualizes Minimum Spanning Tree (MST) algorithms with step-by-step animation and data structure visualization.

## 🔗 Live Demo

Check out the live demo: [MST Visualizer](https://mst-visualizer-xavieragostinos-projects.vercel.app/)

## ✨ Features

### Interactive Graph Visualization
- **Dynamic Graph Rendering:** Clear visualization of nodes and edges.
- **Animated Algorithm Execution:** Watch algorithms work in real-time.
- **Data Structure Visualization:** See exactly how each algorithm works:
  - **Prim's:** Visualizes the visited set and Min-Heap priority queue.
  - **Kruskal's:** Displays sorted edges and Union-Find components.

### Multiple Algorithm Options
- **Prim's Algorithm:** Grows a tree from a single starting vertex.
- **Kruskal's Algorithm:** Sorts edges by weight and adds them if they don't create cycles.

### Graph Creation Options
- **Auto-Generate Mode:** Create random graphs with customizable parameters.
  - Adjust node count.
  - Control edge density.
  - Set weight ranges.
- **Manual Design Mode:** Build custom graphs from scratch with an intuitive interface.
  - Add/remove nodes.
  - Create/delete edges with custom weights.
  - Design specific scenarios to test the algorithms.

### User Controls
- **Step-by-Step Execution:** Move through each algorithm step manually.
- **Animation Speed Control:** Adjust from slow to fast visualization.
- **Show Answer:** Instantly display the complete MST solution.
- **Detailed Explanations:** Each step is described in plain language for educational purposes.

### Educational Components
- **Algorithm Reference:** View pseudocode for both algorithms.
- **Color-Coded States:** Easily distinguish between:
  - Unvisited edges
  - Candidate edges being considered
  - MST edges included in the solution
  - Excluded edges that were rejected

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/mst-visualizer.git
   cd mst-visualizer
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server:**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Open your browser:** The application will be available at http://localhost:3000.

## 📖 How to Use

### Auto-Generate Mode
1. Select **Auto-Generate** from the mode dropdown (this is the default).
2. Adjust parameters:
   - Number of nodes (3-10)
   - Edge density (0.3-1.0)
   - Weight range (1-99)
3. Click **Generate New Graph**.
4. Choose an algorithm: Prim's or Kruskal's.
5. Use the control buttons:
   - **Start**: Begin automated animation.
   - **Step**: Advance the algorithm one step at a time.
   - **Reset**: Clear progress and return the graph to its initial state.
   - **Show**: Instantly display the final MST solution.

### Manual Design Mode
1. Select **Manual Design** from the mode dropdown.
2. Use the toolbar buttons:
   - **Add Node**: Click this button, then click on the graph area to place a node.
   - **Add Edge**: Click this button, then select two nodes to connect (you will be prompted for a weight).
   - **Delete Node**: Click this button, then click on a node to remove it (and its connected edges).
   - **Delete Edge**: Click this button, then click on an edge to remove it.
3. Run algorithms on your custom graph using the same controls (Start, Step, Reset, Show).

## Technologies Used
- **React**: Frontend UI library.
- **TailwindCSS**: Styling and responsive design.
- **Lodash**: Utility functions.
- **SVG**: For rendering graph elements.

## Future Improvements
- Add additional MST algorithms (e.g., Borůvka's algorithm).
- Enable export/import of graph configurations.
- Incorporate interactive tutorials.
- Implement advanced graph layout algorithms for more complex graphs.

## 🤝 Contributing
Contributions are welcome! To contribute:

1. Fork the repository.
2. Create your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. Push to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request and describe your changes.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

Built with ❤️ by Xavier Agostino