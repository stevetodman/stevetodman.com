#!/usr/bin/env python3

import unittest

import numpy as np

from fit_z_anatomy_coronaries import transform, tube, umeyama


class CoronaryFitTests(unittest.TestCase):
    def test_similarity_transform_recovers_known_mapping(self):
        source = np.asarray(
            [(0, 0, 0), (1, 0, 0), (0, 1, 0), (0, 0, 1)], dtype=float
        )
        rotation = np.asarray(((0, -1, 0), (1, 0, 0), (0, 0, 1)), dtype=float)
        target = (2.5 * (rotation @ source.T)).T + np.asarray((3, 4, 5))
        scale, fitted_rotation, translation = umeyama(source, target)
        predicted = transform(source, scale, fitted_rotation, translation)
        self.assertTrue(np.allclose(predicted, target, atol=1e-8))

    def test_tube_is_triangulated_and_capped(self):
        mesh = tube(np.asarray(((0, 0, 0), (0, 0, 4), (1, 0, 8)), dtype=float), 1.0)
        self.assertEqual(mesh.faces.shape[1], 3)
        self.assertTrue(mesh.is_watertight)
        self.assertGreater(mesh.volume, 0)


if __name__ == "__main__":
    unittest.main()
