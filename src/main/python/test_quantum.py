#!/usr/bin/env python3
"""Test quantum imports"""

try:
    from qiskit import QuantumCircuit
    from qiskit.primitives import Sampler
    from qiskit_algorithms import QAOA, VQE
    from qiskit_algorithms.optimizers import COBYLA, SLSQP
    from qiskit_optimization import QuadraticProgram
    from qiskit_optimization.algorithms import MinimumEigenOptimizer
    from qiskit_optimization.converters import QuadraticProgramToQubo
    from qiskit.circuit.library import TwoLocal
    print("✅ All quantum imports successful!")
    print("QAOA:", QAOA)
    print("VQE:", VQE)
except ImportError as e:
    print(f"❌ Import failed: {e}")
