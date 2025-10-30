import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter, LinkProps } from "react-router-dom";
import HomePage from "../HomePage";
import "@testing-library/jest-dom";

// Mock the react-router-dom Link component
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ to, children, className }: LinkProps & { className?: string }) => (
      <a href={to.toString()} className={className}>
        {children}
      </a>
    ),
  };
});

describe("HomePage", () => {
  const renderHomePage = () => {
    return render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    );
  };

  it("renders the correct number of total tiles", () => {
    renderHomePage();
    const allTiles = screen.getAllByTestId("card");
    expect(allTiles).toHaveLength(25); // TOTAL_TILES constant value
  });

  it("renders available subjects with correct content", () => {
    renderHomePage();

    // Test the GitHub Actions subject card
    const githubActionsTitle = screen.getByText("Pierwsze kroki GitHub Actions");
    expect(githubActionsTitle).toBeInTheDocument();

    const githubActionsDescription = screen.getByText(
      "Poznaj podstawy automatyzacji przepływu pracy w GitHub z wykorzystaniem GitHub Actions",
    );
    expect(githubActionsDescription).toBeInTheDocument();

    // Test the PyTorch subject card
    const pytorchTitle = screen.getByText("PyTorch Deep Learning");
    expect(pytorchTitle).toBeInTheDocument();

    const pytorchDescription = screen.getByText(
      "Master deep learning fundamentals with PyTorch framework for research and production",
    );
    expect(pytorchDescription).toBeInTheDocument();

    // Test the Azure CI/CD subject card
    const azureTitle = screen.getByText("Pierwsze kroki z CI/CD w AZURE");
    expect(azureTitle).toBeInTheDocument();

    const azureDescription = screen.getByText(
      "Automatyzacja pipeline'ów w chmurze Microsoft z wykorzystaniem Azure DevOps i Azure Pipelines",
    );
    expect(azureDescription).toBeInTheDocument();

    // Check that there are 3 "Start Learning" buttons (one for each subject)
    const startButtons = screen.getAllByText("Start Learning");
    expect(startButtons).toHaveLength(3);
  });

  it("renders placeholder tiles for remaining slots", () => {
    renderHomePage();

    // Since we have 3 real subjects and TOTAL_TILES is 25, we should have 22 placeholder tiles
    const placeholderDescriptions = screen.getAllByText(
      "Use Agentic AI to create new learning paths",
    );
    expect(placeholderDescriptions).toHaveLength(22);

    // Check if placeholder buttons are disabled
    const disabledButtons = screen.getAllByRole("button", {
      name: /Subject \d+/,
    });
    expect(disabledButtons).toHaveLength(22);
    disabledButtons.forEach((button) => {
      expect(button).toHaveAttribute("disabled");
    });
  });

  it("renders the grid with correct responsive classes", () => {
    const { container } = renderHomePage();

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass(
      "grid-cols-1",
      "sm:grid-cols-2",
      "md:grid-cols-3",
      "lg:grid-cols-4",
      "xl:grid-cols-5",
    );
  });

  it("renders subject title in the correct format", () => {
    renderHomePage();

    const titleElement = screen.getByText("Pierwsze kroki GitHub Actions");
    expect(titleElement).toHaveClass("text-neutral-900", "dark:text-neutral-100");
  });
});
