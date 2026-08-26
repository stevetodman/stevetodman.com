#!/usr/bin/env python3
"""Small deterministic tests for the tetrahedral boundary extractor."""

import unittest

import numpy as np

from build_population_average import compact_mesh, extract_boundary


class BoundaryExtractionTests(unittest.TestCase):
    def test_single_tetrahedron_has_four_boundary_faces(self):
        points = np.asarray(
            [(0, 0, 0), (1, 0, 0), (0, 1, 0), (0, 0, 1)], dtype=np.float32
        )
        tetrahedra = np.asarray([(0, 1, 2, 3)], dtype=np.int32)
        faces, labels = extract_boundary(points, tetrahedra, np.asarray([5]))
        self.assertEqual(faces.shape, (4, 3))
        self.assertTrue(np.all(labels == 5))

    def test_shared_face_is_removed(self):
        points = np.asarray(
            [(0, 0, 0), (1, 0, 0), (0, 1, 0), (0, 0, 1), (0, 0, -1)],
            dtype=np.float32,
        )
        tetrahedra = np.asarray([(0, 1, 2, 3), (0, 2, 1, 4)], dtype=np.int32)
        faces, labels = extract_boundary(points, tetrahedra, np.asarray([1, 2]))
        self.assertEqual(faces.shape, (6, 3))
        self.assertEqual(int(np.sum(labels == 1)), 3)
        self.assertEqual(int(np.sum(labels == 2)), 3)

    def test_compaction_reindexes_only_used_vertices(self):
        points = np.asarray([(0, 0, 0), (9, 9, 9), (1, 0, 0), (0, 1, 0)])
        vertices, faces, used = compact_mesh(points, np.asarray([(0, 2, 3)]))
        self.assertEqual(vertices.shape, (3, 3))
        self.assertEqual(faces.max(), 2)
        self.assertEqual(used.tolist(), [0, 2, 3])


if __name__ == "__main__":
    unittest.main()
